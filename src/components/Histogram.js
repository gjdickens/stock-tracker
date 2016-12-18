
import React, { Component } from 'react';
var d3 = require('d3');


class HistogramBar extends Component {
    render() {
        return (
            <g transform="translate(0, 1)" className="bar">
                <rect width={this.props.width}
                      height={this.props.height-2}
                      transform="translate(0, 1)">
                </rect>
                <text textAnchor="end"
                      x={this.props.width-5}
                      y={this.props.height/2+3}>
                </text>
            </g>
        );
    }
}

class Histogram extends Component {
    constructor(props) {
        super();

        this.line = d3.line();
        this.widthScale = d3.scaleTime();
        this.yScale = d3.scaleLinear();

        this.update_d3(props);
    }

    componentWillReceiveProps(newProps) {
        this.update_d3(newProps);
    }

    update_d3(props) {
        this.line
            .x(function(d) {return d});
            .y(function(d) {return d});


        this.widthScale
            .domain([d3.min(counts), d3.max(counts)])
            .range([9, props.width-props.axisMargin]);

        this.yScale
            .domain([0, d3.max(bars.map((d) => d.x+d.dx))])
            .range([0, props.height-props.topMargin-props.bottomMargin]);
    }

    makeBar(bar) {
        let percent = bar.y/this.props.data.length*100;

        let props = {percent: percent,
                     x: this.props.axisMargin,
                     y: this.yScale(bar.x),
                     width: this.widthScale(bar.y),
                     height: this.yScale(bar.dx),
                     key: "histogram-bar-"+bar.x+"-"+bar.y}

        return (
            <HistogramBar {...props} />
        );
    }

    render() {
        let translate = `translate(0, ${this.props.topMargin})`,
            bars = this.histogram(this.props.data);

        return (
            <g className="histogram" transform={translate}>
                <g className="bars">
                    {bars.map(::this.makeBar)}
                </g>
            </g>
        );
    }
}


export default Histogram;
