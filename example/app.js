var React = window.React = require('react');
var RangeSlider = require('../');

var App = React.createClass({

  displayName: 'React-Range-Slider-Demo',

  getInitialState: function() {
    return {}
  },

  render: function() {
    return (
      <div>
        <div className='header'>
          <h1>React Range Slider</h1>
          <h4>A flexible Slider for reactjs</h4>
        </div>
        <div id='main'>
          <RangeSlider max={200} step={10} value={['#FAD', '#FADFAD']} withBars range/>
        </div>
      </div>
    )
  }
})

React.render(<App />, document.getElementById('react-range-example'))

