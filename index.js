var React = require('react/addons');
var cx = React.addons.classSet;
var PropTypes = React.PropTypes;
var emptyFunction = require('react/lib/emptyFunction');
var event = require('./event');
var Handler = React.createFactory(require('./Handler'));

/**
 * To prevent text selection while dragging.
 * @credits: http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
 */
function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}

/**
 * Reduce `v` with `f` and `init` or call `f` directly with `init` and `v` if it is a single value.
 */
function reduce(v, f, init) {
  return (v && v.reduce) ? v.reduce(f, init) : f(init, v, 0);
}

/**
 * Returns the size of `v` if it is an array, or 1 if it is a single value or 0 if it does not exists.
 */
function size(v) {
  return v != null ? v.length ? v.length : 1 : 0;
}

/**
 * Returns the value at `i` if `v` is an array. Just returns the value otherwise.
 */
function at(v, i) {
  return v && v.map ? v[i] : v;
}

/**
 * Compares `a` and `b` which can be either single values or an array of values.
 */
function is(a, b) {
  return size(a) === size(b) &&
    reduce(a, function (res, v, i) {
      return res && v === at(b, i)
    }, true);
}

/**
 * Spreads `count` values equally between `min` and `max`.
 */
function linspace(min, max, count) {
  var range = (max - min) / (count - 1);
  var res = [];
  for (var i = 0; i < count; i++) {
    res.push(range * i);
  }
  return res;
}

/**
 * Fomat [1, 2] or ['#FFF', '#FAD']
 * To [{value:1, color: null}] or [{value: '20%', color: '#FFF'}]
 */
function valureFormat(value, range) {
  value = typeof value === 'number' ? [value] : value;
  return value.map(function (v, i) {
    return typeof v === 'object' ? v : {
      value: typeof v === 'number' ? v : parseInt((i + 1) * range / value.length, 10),
      color: typeof v === 'string' ? v : ''
    };
  });
  // TO Do: Sort ?
  // .sort(function(a, b) {
  //   return parseInt(a.value) - parseInt(b.value);
  // })
}

/**
 * Find min and max in an object.
 * @credits: http://stackoverflow.com/questions/8864430/compare-javascript-array-of-objects-to-get-min-max
 */
function finder(cmp, arr, attr) {
  var val = arr[0] ? arr[0][attr] || 0 : 0;
  for (var i = 1; i < arr.length; i++) {
    val = cmp(val, arr[i][attr])
  }
  return val;
}

var RangeSlider = React.createClass({

  displayName: 'RangeSlider',

  propTypes: {
    /**
     * Min value for slider, default is 0.
     * Example:
     *
     * ```
     *  <RangeSlider min=0/>
     *
     * ```
     */
    min: PropTypes.number,
    /**
     * Max value for slider, default is 100.
     * Example:
     *
     * ```
     *  <RangeSlider max=999/>
     *
     * ```
     */
    max: PropTypes.number,
    /**
     * Define the value, can be string or array
     *
     * Example:
     *
     * ```
     *  <RangeSlider value=[10,20]/>
     *  or
     *  <RangeSlider value=[{value:10, color: '#FFF'}] />
     *  or
     *  <RangeSlider value=['#FFF', '#FFS'] />
     * ```
     */
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.number),
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.shape({
          value: PropTypes.number,
          color: PropTypes.string
        }))
      ])
    ]),
    /**
     * Orientation for slider, must be horizontal or vertical, default is horizontal.
     * Example:
     *
     * ```
     *  <RangeSlider orientation='vertical'/>
     *
     * ```
     */
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    withBars: PropTypes.bool,
    withCursor: PropTypes.bool,
    pearling: PropTypes.bool,
    disabled: PropTypes.bool,

    range: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.arrayOf(PropTypes.bool),
      PropTypes.arrayOf(PropTypes.number)
    ]),
    disabledHeader: PropTypes.bool,
    disabledTailer: PropTypes.bool,

    onMouseDown: PropTypes.func,
    onBeforeChange: PropTypes.func,
    onChange: PropTypes.func,
    onAfterChange: PropTypes.func,
    // Bar click event
    onBarClick: PropTypes.func
  },

  getDefaultProps: function () {
    return {
      min: 0,
      max: 100,
      value: [],
      defaultValue: 0,
      orientation: 'horizontal',
      withBars: false,
      pearling: false,
      disabled: false,
      onBeforeChange: emptyFunction,
      onChange: emptyFunction,
      onAfterChange: emptyFunction,
      onBarClick: emptyFunction,
      onMouseDown: emptyFunction
    };
  },

  // Mixin events
  mixins: [event],

  getInitialState: function () {
    var range = this.props.range,
      range = (range ? (typeof range === 'boolean' ? [range, range] : range) : []),
      header = range[0],
      tailer = range[1],
      min = this.props.min,
      max = this.props.max,
      min = typeof header === 'number' ? Math.max(header, min) : min,
      max = typeof tailer === 'number' ? Math.min(Math.max(tailer, min), max) : max;
    return {
      min: min,
      max: max,
      header: header,
      tailer: tailer,
      index: -1, // TODO: find better solution
      upperBound: 0,
      sliderLength: 0,
      axis: this.isHorizontal() ? 'X' : 'Y',
      minProp: this.isHorizontal() ? 'left' : 'top',
      maxProp: this.isHorizontal() ? 'right' : 'bottom',
      value: valureFormat(this.props.value, this.props.max - this.props.min)
    };
  },

  isHorizontal: function () {
    return this.props.orientation !== 'vertical';
  },

  componentWillMount: function () {
    this.addEvent(window, 'resize', this.handleResize);
  },

  componentDidMount: function () {
    this.handleResize();

    // var value = map(this.state.value, this._trimAlignValue);
    // this.setState({
    //   value: value
    // });
  },

  componentWillUnmount: function () {
    this.removeEvent(window, 'resize', this.handleResize);
  },

  getValue: function () {
    return this.state.value
  },

  handleResize: function () {
    var slider = this.refs.slider.getDOMNode();
    var handle = this.refs.header ? this.refs.header.getDOMNode() : {};
    var rect = slider.getBoundingClientRect();

    var size = this.isHorizontal() ? 'clientWidth' : 'clientHeight';

    var sliderMax = rect[this.props.maxProp] - (handle[size] || 0);
    var sliderMin = rect[this.props.minProp];

    this.setState({
      upperBound: slider[size] - (handle[size] || 0),
      sliderLength: sliderMax - sliderMin
    });
  },

  handleDragStart: function (i, e) {
    if (this.props.disabled) return;
    // Make it possible to attach event handlers on top of this one
    this.props.onMouseDown(e);
    e = this.isTouchDevice() ? e.changedTouches[e.changedTouches.length - 1] : e;
    var position = e['page' + this.state.axis];
    var value = this.state.min,
      l = this.state.value.length;
    if (l != 0 && 0 < i && i <= l) {
      value = this.state.value[i - 1].value;
    } else if (i === l + 1) {
      value = this.state.max;
    }
    this.setState({
      startValue: value,
      startPosition: position,
      index: i,
    });

    this.props.onBeforeChange(e);

    // Add event handlers
    this.addEvent(window, this.dragEventFor['move'], this.handleDrag);
    this.addEvent(window, this.dragEventFor['end'], this.handleDragEnd);
    pauseEvent(e);
  },

  handleDrag: function (e) {
    if (this.props.disabled) return;

    e = this.isTouchDevice() ? e.changedTouches[e.changedTouches.length - 1] : e;
    var position = e['page' + this.state.axis],
      diffPosition = position - this.state.startPosition,
      diffValue = (diffPosition / this.state.upperBound) * (this.props.max - this.props.min),
      i = this.state.index,
      l = this.state.value.length;
    if (i === 0) {
      // Move header
      // if(this.props.disabledHeader) return;
      var v = l > 0 ? finder(Math.min, this.state.value, 'value') : this.state.max;
      var _v = diffValue + this.state.startValue;
      this.setState({
        min: parseInt(Math.max(_v <= v ? (_v < 0 ? 0 : _v) : v, this.props.min), 10)
      });
    } else if (0 < i < l) {
      // Move cursor


    } else if (i === l + 1) {
      // Move tailer
      var v = l > 0 ? finder(Math.max, this.state.value, 'value') : this.state.min;
      var _v = this.state.startValue + diffValue;
      this.setState({
        max: parseInt(Math.min(_v >= v ? _v : v, this.props.max))
      });
    }

    this.props.onChange(this.state.value);
  },

  handleDragEnd: function (e) {
    this.setState({
      index: -1
    });

    this.props.onAfterChange(this.state.value);

    // Remove event handlers
    this.removeEvent(window, this.dragEventFor['move'], this.handleDrag);
    this.removeEvent(window, this.dragEventFor['end'], this.handleDragEnd);
  },

  handleBarClick: function (i, e) {
    this.props.onBarClick(e, i, this.state.value[i]);
  },

  renderCursor: function (offset, i, child) {
    var l = this.state.value.length;
    var ref = 'cursor' + i, zIndex = i + 1;
    if (i === 0) {
      ref = 'header';
      zIndex = 0;
    } else if (i === l + 1) {
      ref = 'tailer';
      zIndex = 0;
    }
    return Handler({
      axis: this.state.axis,
      offset: offset,
      ref: ref,
      key: ref,
      zIndex: zIndex,
      className: 'cursor ' + ref,
      onDragStart: this.handleDragStart.bind(null, i),
      onDragEnd: this.handleDragEnd
    }, child)
  },

  renderCursors: function (offsets) {
    var handlers = offsets.map(function (offset, i) {
      return this.renderCursor(offset, i + 1)
    }, this);
    if (this.state.header) {
      handlers.splice(0, 0, this.renderCursor(this.calcOffset(this.state.min), 0,
        React.createElement('span', null, this.state.min)));
    }
    if (this.state.tailer) {
      var l = handlers.length;
      handlers.push(this.renderCursor(this.calcOffset(this.state.max), l,
        React.createElement('span', null, this.state.max)));
    }
    return handlers;
  },

  // calculates the offset of a handle in pixels based on its value.
  calcOffset: function (v) {
    v = typeof v === 'number' ? v : v.value;
    var ratio = (v - this.props.min) / (this.props.max - this.props.min);
    return ratio * this.state.upperBound;
  },

  renderBar: function (from, to, i) {
    var style = {
      position: 'absolute',
      backgroundColor: this.state.value.length > 0 ? this.state.value[i].color : null
    };
    style[this.state.minProp] = from;
    style[this.state.maxProp] = this.state.upperBound - to;
    return React.createElement('div', {
      key: 'bar' + i,
      ref: 'bar' + i,
      className: 'bar bar-' + i,
      style: style,
      onClick: this.handleBarClick.bind(this, i)
    });
  },

  renderBars: function (offsets) {
    var minOffset = this.calcOffset(this.state.min);
    var bars = offsets.map(function (offset, i) {
      return this.renderBar(offsets[i - 1] || minOffset, offset, i)
    }, this);
    if (bars.length === 0) {
      bars.push(this.renderBar(minOffset, this.calcOffset(this.state.max), 0));
    }
    return bars;
  },

  render: function () {
    var offsets = this.state.value.map(this.calcOffset, this);
    var bars = this.props.withBars ? this.renderBars(offsets) : null;
    var cursors = this.renderCursors(offsets);

    return (
      React.createElement('div', {
          ref: 'slider',
          style: {
            position: 'relative'
          },
          className: 'range-slider ' + this.props.orientation
        },
        React.createElement('div', {
          className: 'bars'
        }, bars),
        cursors
      )
    );
  }
});

module.exports = RangeSlider;
