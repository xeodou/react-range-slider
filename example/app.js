var React = window.React = require('react');
var ReactDOM = require('react-dom');
var RangeSlider = require('../');

var App = React.createClass({

  displayName: 'React-Range-Slider-Demo',

  getInitialState: function() {
    return {}
  },

  afterChange: function () {
    console.log('after change called');
  },

  beforeChange: function () {
    console.log('before change called');
  },

  render: function() {
    return (
      <div>
        <div className='header'>
          <h1>React Range Slider</h1>
          <h4>A flexible Slider for reactjs</h4>
        </div>
        <div id='main'>
          <RangeSlider onBeforeChange={this.beforeChange} onAfterChange={this.afterChange} value={[ '#42c6da','#3cb9ec','#42a5f5','#4a80df','#5c6bc0']} withBars cursor range={[true]}/>
        </div>
      </div>
    )
  }
})

ReactDOM.render(<App />, document.getElementById('react-range-example'))

