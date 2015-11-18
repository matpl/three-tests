// main.js
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var CommentList = React.createClass({
  getInitialState: function() {
      return {stuff: []};
  },
  loadLoop: function()
  {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
          this.setState({stuff: data});
      }.bind(this),
      error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment)
  {
      var comments = this.state.stuff;
    // Optimistically set an id on the new comment. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({stuff: newComments});
    /*$.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({stuff: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });*/
  },
  componentDidMount: function()
  {
      this.loadLoop();
      setInterval(this.loadLoop, this.props.pollInterval);
  },
  render: function()
  {
      var comments = [];
      this.state.stuff.forEach(function(data) {
         comments.push(<CommentBox key={data.id} teststuff={data.name}>{data.text}</CommentBox>); 
      });
    return <div><CommentForm onCommentSent={this.handleCommentSubmit} />{comments}</div>;
  }
});

var CommentBox = React.createClass({
  render: function() {
      return (<h1>{this.props.teststuff}. {this.props.children}</h1>);
  }
});

var CommentForm = React.createClass({
    handleSubmit: function(e)
    {
      e.preventDefault();
      var name = this.refs.name.value.trim();
      var email = this.refs.email.value.trim();
      if(!name || !email)
          return;
      
      this.props.onCommentSent({id: 4, name: name, text: email});
      this.refs.name.value = '';
      this.refs.email.value = '';
      
      return;
    },
   render: function() {
     return (<form onSubmit={this.handleSubmit}>
               <input type="text" ref="name" placeholder="Your name" />
               <input type="text" ref="email" placeholder="Your email" />
               <input type="submit" value="Send" />
            </form>);
   }   
});

ReactDOM.render(
  <CommentList url='js/api/comments' pollInterval={2000} />,
  document.getElementById('example')
);