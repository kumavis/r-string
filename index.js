/*!
 * r-string
 * Copyright 2015 by Marcel Klehr <mklehr@gmx.net>
 *
 * (MIT LICENSE)
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var RArray   = require('r-array')
var inherits = require('util').inherits

function split(str) {
  return str.split('\n').map(function (l, i, a) {
    if(i != a.length - 1)
      return l + '\n'
    return l
  })
}

module.exports = RString

inherits(RString, RArray)

function RString() {
  if(!(this instanceof RString)) return new RString()
  RArray.call(this)
}

var R = RString.prototype

R.text  = function text () {
  return this.toJSON().join('')
}

R.insertChar = function(at, char) {
  this.splice(at, 0, char)
}

R.insertString = function(at, str) {
  // insert backwards char-by-char
  for(var i=str.length-1; i>=0; i--) {
    this.insertChar(at, str[i])
  }
}

R.remove = function(at, length) {
  this.splice(at, length)
}

R.wrapTextinput = function(textarea) {
  var r = this
  
  // Set current value
  textarea.value = r.text()
  
  var start
    , end
  
  function onPreupdate (ch) {
  
    //force update when recieve message.
    var cursorStart = 0, cursorEnd = 0

    start = textarea.selectionStart
    end   = textarea.selectionEnd
    
    //what atom contains the cursor?
    var startKey = r.keys[start]
      , endKey = r.keys[end]
    
    //how much will be inserted into the document?
    for(var key in ch) {
      if(key < startKey) {
        if(ch[key]) cursorStart++
        else cursorStart--
      }
      if(key < endKey) {
        if(ch[key]) cursorEnd++
        else cursorEnd--
      }
    }
    //THIS IS ACTUALLY WRONG. CAN'T insert into a selection!
    start = start + cursorStart
    end   = end   + cursorEnd
  }
  this.on('preupdate', onPreupdate)

  function on_update (update) {
    if(update[2] !== r.id) {
      // set value
      oldval = textarea.value = r.text()
      
      // fix selection
      textarea.selectionStart = start
      textarea.selectionEnd   = end
      
      //textarea.dispatchEvent(new window.Event('input')) // XXX: What for?
    }
  }
  this.on('_update'  , on_update)
  
  
  // Collect changes
  
  var oldval = r.text()
    , collectingChangesLock = false
  
  function collectChanges() {
    var newval = textarea.value

    // The following code is taken from shareJS:
    // https://github.com/share/ShareJS/blob/3843b26831ecb781344fb9beb1005cfdd2/lib/client/textarea.js

    if (oldval === newval) return;

    var commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
      commonStart++;
    }
    var commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
      commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
      commonEnd++;
    }
    if (oldval.length !== commonStart + commonEnd) {
      r.remove(commonStart, oldval.length - commonStart - commonEnd);
    }
    if (newval.length !== commonStart + commonEnd) {
      r.insertString(commonStart, newval.slice(commonStart, newval.length - commonEnd));
    }

    oldval = newval
  }

  var eventNames = ['textInput', /*'keydown',*/ 'keyup', 'cut', 'paste', 'drop', 'dragend'];
  for (var i = 0; i < eventNames.length; i++) {
    var e = eventNames[i];
    if (textarea.addEventListener) {
      textarea.addEventListener(e, genOp, false);
    } else {
      textarea.attachEvent('on' + e, genOp);
    }
  }
  function genOp(evt) {
    console.log(evt)
    collectChanges()
  }
  
  return this
}