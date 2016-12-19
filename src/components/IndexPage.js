// src/components/IndexPage.js
import React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import io from 'socket.io-client';
import Chart from './Chart.js';
import d3 from 'd3';
if(process.env.WEBPACK) require('./IndexPage.scss');

const socket = io.connect('https://gj-stock-tracker.herokuapp.com/');
//const socket = io.connect('localhost:3000');

export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);

    this.addQuote = this.addQuote.bind(this);
    this.changeQuoteSearch = this.changeQuoteSearch.bind(this);
    this.removeQuote = this.removeQuote.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);


    this.state = {
      searchField: "",
      tickers: [],
      data: [],
      showInvalidQuote: false,
      invalidQuoteText: ''
    }
  }

  componentDidMount() {
    var that = this;
    socket.on('quoteData', function(data) {
      var tickersArr = data.map(function(arr,i) {
        let latest = arr.length - 1;
        return {ticker: arr[latest].ticker, close: arr[latest].close}
      })
      that.setState({tickers: tickersArr, data: data});
      });
    socket.on('invalidQuote', function(data) {
      that.setState({invalidQuoteText: 'Stock ticker not recognized, please try another', showInvalidQuote: true});
      });
    socket.on('newQuoteData', function(data) {
      let latest = data.length - 1;
      that.setState({tickers: that.state.tickers.concat([{ticker: data[latest].ticker, close: data[latest].close}]), data: that.state.data.concat([data]), showInvalidQuote: false});
      });
    socket.on('removeQuoteData', function(data) {
      that.setState({
        tickers:that.state.tickers.filter(function(arr) {
          return arr.ticker !== data;
        }),
        data: that.state.data.filter(function(arr) {
          return arr[0].ticker !== data;
        })
      })
    });
  }

  changeQuoteSearch(e) {
    this.setState({searchField: e.target.value.toUpperCase()});
  }


  addQuote() {
    let searchField = this.state.searchField;
    let tickersArr = this.state.tickers.filter(function(arr) {
      return arr.ticker === searchField;
    })
    if (tickersArr.length > 0) {
      this.setState({showInvalidQuote: true, invalidQuoteText:'Quote already added', searchField: ''});
    }
    else {
      socket.emit('newQuote', this.state.searchField);
      this.setState({showInvalidQuote: false, invalidQuoteText:'', searchField: ''});
    }
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.addQuote();
    }
  }

  removeQuote(e) {
    socket.emit('removeQuote', e.target.id);
  }


  render() {
    return (
      <div className="container">
      <h1 className="text-center">Stock Quotes</h1>

        <div>
        {this.state.data.length > 0 ?
          <Chart
            rawData={this.state.data}
            tickers={this.state.tickers} />
          :
          <h2 className="text-center">Add a Quote</h2>
        }
        </div>

        <div>
        {this.state.tickers ?
          this.state.tickers.map(stockData =>
            <div className="col-xs-6 col-md-2 card quoteCard" key={stockData.ticker}>
              <h3 className="card-title">{stockData.ticker}</h3>
              <h4 className="card-text">{stockData.close}</h4>
              <a href="#" id={stockData.ticker} onClick={this.removeQuote} className="card-link">Remove</a>
            </div>)
            :
            <h2>Select a stock to view</h2>
          }
          <div className="col-xs-8 col-md-4 card">
            <h3 className="card-title">Add quote</h3>
            <input type="text" placeholder="Ticker Symbol" value={this.state.searchField} onKeyPress={this.handleKeyPress} onChange={this.changeQuoteSearch}></input>
            <button onClick={this.addQuote}>+</button>
            {this.state.showInvalidQuote ?
            <p>{this.state.invalidQuoteText}</p>
          :
            <p></p>
          }
          </div>
          </div>


        <footer className="col-xs-12">
          <p className="text-center">Powered by Quandl</p>

        </footer>
      </div>
    );
  }
}
