import React, { Component } from 'react';
import ReactDOM, {findDOMNode} from 'react-dom';

var d3 = require('d3');

export default ({rawData, tickers, width, height}) => {
  if (rawData.length < 1) {
    return (
      <h2 className="text-center">Loading</h2>
    )
  }
  else {
    var minDate = new Date(rawData[0][0].date);
    var maxDate = new Date(rawData[0][rawData[0].length-1].date);
    var maxYArr = rawData.map(function(arr, i) {
      return d3.max(arr, function(data) {
        return data.close;
      })
    });
    var minYArr = rawData.map(function(arr, i) {
      return d3.min(arr, function(data) {
        return data.close;
      })
    });
    var maxY = d3.max(maxYArr, function(data) {
      return data;
    });

    var data = {
      points: rawData,
      xValues: [minDate, maxDate],
      yMin: 0,
      yMax: maxY,
      names: tickers
    };


    return <LineChart
            data={data}
            width={width}
            height={height} />;
  }

}



class Line extends React.Component {
  constructor() {
    super();

  }
  render() {
    let { path, stroke, fill, strokeWidth } = this.props;
    return (
      <g>
        <path
          d={path}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          />
      </g>
    );
  }

};

Line.defaultProps = {
  stroke: 'blue',
  fill: 'none',
  strokeWidth: 3
};

Line.propTypes = {
  path: React.PropTypes.string.isRequired,
  stroke: React.PropTypes.string,
  strokeWidth: React.PropTypes.number
};








//TO DO: need circles for each point along path

class DataSeries extends React.Component {
  constructor() {
    super();

    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.displayText = this.displayText.bind(this);

  }

  handleMouseOver(e) {
    e.target.parentNode.style.opacity = 0.9;

  }

  handleMouseOut(e) {
    e.target.parentNode.style.opacity = 0.0;
  }

  displayText(e) {
    console.log(this);
    console.log(e);
    return 'middle';
  }

  render() {
    let { data, colors, xScale, yScale, interpolationType, marginSide, marginTop, width } = this.props;

    let line = d3.line()
      .x((d) => {
        var xDate = d3.timeParse("%Y-%m-%d")(d.date);
        return xScale(xDate);
      })
      .y((d) => {
        return yScale(d.close);
      });

    let lines = data.points.map((series, id) => {
      return (
        <Line
          path={line(series)}
          seriesName={data.names[id]}
          stroke={colors(id)}
          key={id}
          />
      );
    });

    let renderCircles = (series, id) => {
      var that = this;
      return series.map(function(point, i) {
        let xDate = d3.timeParse("%Y-%m-%d")(point.date);
        let xPoint = xScale(xDate);
        let yPoint = yScale(point.close);
        return (
          <g style={{opacity: 0}}>
          <circle
            cx = {xPoint}
            cy = {yPoint}
            r = {5}
            key = {i}
            fillOpacity={'0.9'}
            id={point.ticker + ',' + point.close}
            onMouseOver={that.handleMouseOver}
            onMouseOut={that.handleMouseOut}
         />
         <text
         x = {xPoint > (width/1.2) ? xPoint - (width/15) : xPoint }
         y = {yPoint - 10}
         >{point.ticker}: {point.close}</text>
         </g>
        )
      });
    };

    let labels = data.points.map((series, id) => {
      return <g>{ renderCircles(series, id) }</g>
    });


    return (
      <g>
          <g
            transform={'translate(' + marginSide + ',' + marginTop + ')'}
            >{lines}</g>
        <g
          transform={'translate(' + marginSide + ',' + marginTop + ')'}
          >{labels}</g>
      </g>
    );
  }

};

DataSeries.defaultProps = {
  data: {},
  interpolationType: 'cardinal',
  colors: d3.scaleOrdinal(d3.schemeCategory10),
  xScale: React.PropTypes.func,
  yScale: React.PropTypes.func
};

DataSeries.propTypes = {
  colors: React.PropTypes.func,
  data: React.PropTypes.object,
  interpolationType: React.PropTypes.string
};




class XAxis extends React.Component {
  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    var node  = this.refs.axis;
    var axis = d3.axisBottom().ticks(5).scale(this.props.scale);
    d3.select(node).call(axis);
  }

  render() {
    return <g className="axis" ref="axis" transform={`translate(${this.props.marginSide}, ${this.props.height})`}></g>
  }
}

class YAxis extends React.Component {
  componentDidMount() {
    this.renderAxis();
  }

  componentDidUpdate() {
    this.renderAxis();
  }

  renderAxis() {
    var node  = this.refs.axis;
    var axis = d3.axisLeft().ticks(5).scale(this.props.scale);
    d3.select(node).call(axis);
  }

  render() {
    return <g className="axis" ref="axis" transform={`translate(${this.props.marginSide}, ${this.props.marginTop})`}></g>
  }
}


class LineChart extends React.Component {
  constructor() {
    super();

    this.state = { size: { w: 0 } };
  }

  fitToParentSize() {
    const elem = ReactDOM.findDOMNode(this);
    const w = elem.parentNode.offsetWidth;
    const currentSize = this.state.size;
    if (w !== currentSize.w ) {
      this.setState({
        size: { w },
      });
    }
  }

  componentDidMount() {
    window.addEventListener('resize', ::this.fitToParentSize);
    this.fitToParentSize();
  }

  componentWillReceiveProps() {
    this.fitToParentSize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', ::this.fitToParentSize);
  }

  render() {
    let { width, height, data} = this.props;
    width = this.state.size.w || 1200;
    height = width / 3;
    let marginTop = width / 20;
    let marginSide = width / 30;




    let xScale = d3.scaleTime()
      .domain(data.xValues)
      .range([0, width - (marginSide*2)]);

    let yScale = d3.scaleLinear()
      .range([height - marginTop, 10])
      .domain([data.yMin, data.yMax]);




    let yAxis = d3.axisLeft(yScale)
      .ticks(5);

    return (
      <svg width={width} height={height + marginTop}>
        <DataSeries
          xScale={xScale}
          yScale={yScale}
          data={data}
          width={width - marginSide}
          height={height - marginTop}
          marginTop={marginTop}
          marginSide={marginSide}
          />
        <XAxis
          scale={xScale}
          height={height}
          marginTop={marginTop}
          marginSide={marginSide}
          />
        <YAxis
          scale={yScale}
          height={height}
          marginTop={marginTop}
          marginSide={marginSide}
          />
      </svg>
    );
  }

};

LineChart.propTypes = {
  width:  React.PropTypes.number,
  height: React.PropTypes.number,
  data:   React.PropTypes.object.isRequired
};
