// src/components/IndexPage.js
import React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import io from 'socket.io-client';

const socket = io.connect('/');


export default class IndexPage extends React.Component {
  constructor(props) {
    super(props);

    this.addQuote = this.addQuote.bind(this);
    this.changeQuoteSearch = this.changeQuoteSearch.bind(this);
    this.removeQuote = this.removeQuote.bind(this);


    this.state = {
      searchField: "",
      data: []
    }
  }

  componentDidMount() {
    var that = this;
    socket.on('quoteData', function(data) {
      console.log(data);
      that.setState({data: data});
      });
  }

  changeQuoteSearch(e) {
    this.setState({searchField: e.target.value});
  }

  addQuote() {
    socket.emit('newQuote', this.state.searchField);
    this.setState({searchField: ""});
  }


  removeQuote(e) {
    socket.emit('removeQuote', e.target.id);
  }

  fetchQuotes(ticker) {
    var that = this;
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    var options = {
      method: 'post',
      body: JSON.stringify({
        ticker: ticker
      }),
      headers: myHeaders
      };
    console.log(options);
    fetch('/search', options)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      var quoteData = that.state.data.map(function(arr) {
        if (arr.ticker === ticker) {
          arr.data = json;
        };
      })
      that.setState({data: quoteData});
    });
  }


  render() {
    return (
      <div className="well">
        <ListGroup>
          {this.state.data.map(stockData =>
            <ListGroupItem key={stockData.ticker}>
              {stockData.ticker}
              <button id={stockData.ticker} onClick={this.removeQuote}>X</button>
            </ListGroupItem>)}
          <div className="quoteSearch">
          <input type="text" placeholder="Ticker Symbol" value={this.state.searchField} onChange={this.changeQuoteSearch}></input>
          <button onClick={this.addQuote}>+</button>
          </div>
        </ListGroup>
        <footer>
          <p className="text-center">Powered by Yelp</p>
        </footer>
      </div>
    );
  }
}
