/*!
 * FlatScroll.js v0.0.1
 * Copyright 2013, Thierry Francois @colymba
 * Released under BSD 3 Clause license
 */

/**
 * This content is released under the BSD Simplified license
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * 
 * FlatScroll CSS style
 * use /dist/css/flatScroll.css
 * or /dist/css/flatScroll.scss for SASS mixin
 */

(function($){

  $.FlatScroll = function( options, element ){
    this.dom = {};
    this.dom.container = $( element );
    this.$document = $( document );
    this.$window   = $( window );

    this._init( options );
  };

  $.FlatScroll.settings = {
    namespace: 'flatScroll',
    baseClass: 'flatScroll',
    direction: 'vertical',
    scrollerWidth: 'auto'
  };


  $.FlatScroll.prototype = {

    _init: function( options )
    {
      this.options = $.extend( {}, $.FlatScroll.settings, options );
      this.data    = {};

      this._build();

      if ( this.options.direction === 'horizontal' )
      {
        this._fitScrollerWidth();
      }

      this._fitScrollBar();
      this._updateThumbSize();

      this._regHandlers();
    },


    destroy: function()
    {
      this._removeHandlers();
      this._deleteNodes();
    },


    _build: function()
    {
      var container = this.dom.container,

          wrapperClass   = this.options.baseClass + '_wrap',
          scrollerClass  = this.options.baseClass + '_scroll',
          containerClass = this.options.baseClass + '_container',

          wrapper        = '<div class="' + this.options.direction + ' ' + wrapperClass + '">'
                              + '<div class="' + scrollerClass + '">'
                              + '</div>'
                            + '</div>',
          scrollBar      = '<div class="bar"><div class="thumb"></div></div>'
          ;

      container.addClass( containerClass )
               .wrapInner( wrapper )
               .find('.' + this.options.baseClass + '_wrap')
               .append(scrollBar)
               ;
      /*
      this.options.selectors = {
        container: '.' + containerClass,
        wrapper:   '.' + wrapperClass,
        scroller:  '.' + scrollerClass,
        bar:       '.bar',
        thumb:     '.thumb'
      };*/

      
      this.dom.wrapper  = container.find('.' + wrapperClass);
      this.dom.scroller = container.find('.' + scrollerClass);
      this.dom.bar      = container.find('.bar');
      this.dom.thumb    = container.find('.thumb');
    },


    _deleteNodes: function()
    {
      var containerClass = this.options.baseClass + '_container',
          html = this.dom.scroller.html()
          ;

      this.dom.container.removeClass( containerClass ).empty().html( html );
    },


    /* ***********************************************************************************
     * EVENTS
     * *********************************************************************************** */


    _regHandlers: function()
    {
      var ns = this.options.namespace
          _this = this
          ;

      this.dom.bar.on('mousedown.' + ns, $.proxy(this._scrollJump, this) );

      this.dom.thumb.on('mousedown.' + ns, $.proxy(this._startScroll, this) );
      this.dom.thumb.on('mouseup.'   + ns, $.proxy(this._stopScroll, this) );
      this.dom.thumb.on('mousemove.' + ns, $.proxy(this._scroll, this) );

      this.dom.wrapper.on('scroll.'   + ns, $.proxy(this._updateScrollBar, this) );    
      this.dom.container.on('scroll.' + ns, $.proxy(this._lockContainerScroll, this) );     
      
      //fixes off screen + move off thumb issues
      this.$document.on('mouseup.'    + ns, $.proxy(this._stopScroll, this) );
      this.$document.on('mouseleave.' + ns, $.proxy(this._stopScroll, this) );
      this.$document.on('mousemove.'  + ns, $.proxy(this._scroll, this) );

      if ( $.isFunction( $.throttle ) )
      {
        this.$window.on('resize.' + ns, $.throttle( 250, $.proxy(_this._windowResizeUpdates, _this) ) );
      }
      else{
        this.$window.on('resize.' + ns, $.proxy(this._windowResizeUpdates, this) );
      }
    },


    _removeHandlers: function()
    {
      var ns = this.options.namespace;

      this.dom.bar.off('mousedown.' + ns);

      this.dom.thumb.off('mousedown.' + ns);
      this.dom.thumb.off('mouseup.'   + ns);
      this.dom.thumb.off('mousemove.' + ns);

      this.dom.wrapper.off('scroll.'   + ns);    
      this.dom.container.off('scroll.' + ns);     
      
      this.$document.off('mouseup.'    + ns);
      this.$document.off('mouseleave.' + ns);
      this.$document.off('mousemove.'  + ns);

      this.$window.off('resize.' + ns);
    },


    /* ***********************************************************************************
     * ON RESIZE UPDATES
     * *********************************************************************************** */


    _windowResizeUpdates: function( event )
    {
      this._fitScrollBar();
      this._updateThumbSize();
      this._fixScrollBarScrollPosition( event.data );
    },


    /* ***********************************************************************************
     * DATA
     * *********************************************************************************** */


    _updateScrollData: function()
    {
      var data      = this.data,

          thumb     = this.dom.thumb,
          thumbH    = thumb.height(),
          thumbW    = thumb.width(),

          bar       = this.dom.bar,
          barY      = bar.offset().top,
          barX      = bar.offset().left,
          barH      = bar.height(),
          barW      = bar.width(),

          curY      = event.pageY,
          curX      = event.pageX,

          curYStart = data.dragStartY,
          curXStart = data.dragStartX
          ;

      data.deltaY = Math.abs( curYStart - curY );
      data.deltaX = Math.abs( curXStart - curX );

      data.directionX = data.directionY = 1;

      data.minV = 0;
      data.maxV = barH - thumbH;

      data.minH = 0;
      data.maxH = barW - thumbW;

      if ( curY < curYStart )
      {
        data.directionY = -1;
      }

      if ( curX < curXStart )
      {
        data.directionX = -1;
      }

      data.dragStartY = curY;
      data.dragStartX = curX;

      this.data = data;
    },


    /* ***********************************************************************************
     * SCROLLING
     * *********************************************************************************** */


    _startScroll: function( event )
    {
      this.data.drag       = true;
      this.data.dragStartY = event.pageY;
      this.data.dragStartX = event.pageX;
      this._disableSelection();
      event.stopPropagation(); 
    },

    _stopScroll: function( event )
    {
      this.data.drag = false;
      this._enableSelection();   
    },

    _scroll: function( event, data )
    {
      if ( this.data.drag )
      {
        this._updateScrollData();

        var data = this.data,
            //thumb pos follows mouse
            thumbY,
            thumbX
            ;

        //move
        if ( this.options.direction === 'vertical' )
        {
          thumbY = this.dom.thumb.position().top + (data.deltaY * data.directionY);

          //limits Y
          if ( thumbY > data.maxV )
          {
            thumbY = data.maxV;
          }
          if ( thumbY < data.minV )
          {
            thumbY = data.minV;
          }

          this.dom.thumb.css({
            top: thumbY + 'px'
          });
        }
        else{
          thumbX = this.dom.thumb.position().left + (data.deltaX * data.directionX);

          //limits X
          if ( thumbX > data.maxH )
          {
            thumbX = data.maxH;
          }
          if ( thumbX < data.minH )
          {
            thumbX = data.minH;
          }

          this.dom.thumb.css({
            left: thumbX + 'px'
          });
        }        

        //scroll
        this._doScroll();
      }
    },

    _doScroll: function()
    {
      var scrollPercent,
          delta,
          wrapperScroll
          ;

      if ( this.options.direction === 'vertical' )
      {
        scrollPercent = this.dom.thumb.position().top / this.data.maxV;
        delta         = this.dom.scroller.height() - this.dom.wrapper.height();
        wrapperScroll = delta * scrollPercent;

        //scroll
        this.dom.wrapper.scrollTop( wrapperScroll );

        //keep scroll bar static
        this.dom.bar.css({
          top: wrapperScroll + 'px'
        });
      }
      else{
        scrollPercent = this.dom.thumb.position().left / this.data.maxH;
        delta         = this.dom.scroller.width() - this.dom.wrapper.width();
        wrapperScroll = delta * scrollPercent;

        //scroll
        this.dom.wrapper.scrollLeft( wrapperScroll );

        //keep scroll bar static
        this.dom.bar.css({
          left: wrapperScroll + 'px'
        });
      }
    },


    /* ***********************************************************************************
     * SCROLL BAR
     * *********************************************************************************** */


    _scrollJump: function( event )
    {
      this._updateScrollData();

      var curY      = event.pageY,
          curX      = event.pageX,

          barOffset = this.dom.bar.offset(),
          barY      = barOffset.top,
          barX      = barOffset.left,

          curBarY   = curY - barY,
          curBarX   = curX - barX,

          delta,
          scrollPercent,
          wrapperScroll
          ;

      if ( this.options.direction === 'vertical' )
      {
        delta         = this.dom.scroller.height() - this.dom.wrapper.height();
        scrollPercent = curBarY / this.dom.bar.height();
        wrapperScroll = delta * scrollPercent;

        //scroll
        this.dom.wrapper.scrollTop( wrapperScroll );

        //keep scroll bar static
        this.dom.bar.css({
          top: wrapperScroll + 'px'
        });
      }
      else{
        delta         = this.dom.scroller.width() - this.dom.wrapper.width();
        scrollPercent = curBarX / this.dom.bar.width();
        wrapperScroll = delta * scrollPercent;

        //scroll
        this.dom.wrapper.scrollLeft( wrapperScroll );

        //keep scroll bar static
        this.dom.bar.css({
          left: wrapperScroll + 'px'
        });
      }
    },

    
    _updateScrollBar: function( event )
    {
      //update if not being dragged
      if ( !this.data.drag )
      {
        this._updateScrollData();

        var wrapper = this.dom.wrapper,
            scroller = this.dom.scroller,

            delta,
            scrolled,
            scrollPercent,
            thumbY,
            thumbX
            ;

        if ( this.options.direction === 'vertical' )
        {
          delta = scroller.height() - wrapper.height();

          //fix overscroll          
          if ( wrapper.scrollTop() > delta )
          {
            wrapper.scrollTop( delta );
          }

          //calculate thumbY
          scrolled        = wrapper.scrollTop();
          scrolledPercent = scrolled / delta;
          thumbY          = this.data.maxV * scrolledPercent;

          //limits
          if ( thumbY > this.data.maxV )
          {
            thumbY = this.data.maxV;
          }
          if ( thumbY < this.data.minV )
          {
            thumbY = this.data.minV;
          }

          //keep scroll bar static
          this.dom.bar.css({
            top: scrolled + 'px'
          });

          //move thumb
          this.dom.thumb.css({
            top: thumbY + 'px'
          });
        }
        else{
          delta = scroller.width() - wrapper.width();

          //fix overscroll          
          if ( wrapper.scrollLeft() > delta )
          {
            wrapper.scrollLeft( delta );
          }

          //calculate thumbY
          scrolled        = wrapper.scrollLeft();
          scrolledPercent = scrolled / delta;
          thumbX          = this.data.maxH * scrolledPercent;

          //limits
          if ( thumbX > this.data.maxH )
          {
            thumbX = this.data.maxH;
          }
          if ( thumbX < this.data.minH )
          {
            thumbX = this.data.minH;
          }

          //keep scroll bar static
          this.dom.bar.css({
            left: scrolled + 'px'
          });

          //move thumb
          this.dom.thumb.css({
            left: thumbX + 'px'
          });
        }
      }
    },    


    /* ***********************************************************************************
     * UTILITIES
     * *********************************************************************************** */


    _fitScrollerWidth: function()
    {
      var width = this.options.scrollerWidth;

      if ( this.options.scrollerWidth === 'auto' )
      {
        width = 0

        this.dom.scroller.children().each(function(index, element){
          width += $(element).outerWidth(true);
        });

        width = width + 'px';
      }

      this.dom.scroller.css('width', width);
    },


    _fitScrollBar: function()
    {
      if ( this.options.direction === 'vertical' )
      {
        this.dom.bar.height( this.dom.wrapper.height() );
      }
      else{
        this.dom.bar.width( this.dom.wrapper.width() );
      }      
    },

    _updateThumbSize: function()
    {
      var thumbSize;

      if ( this.options.direction === 'vertical' )
      {
        thumbSize = this.dom.wrapper.height() / this.dom.scroller.height() * 100;
      }
      else{
        thumbSize = this.dom.wrapper.width() / this.dom.scroller.width() * 100;
      }

      //limits
      if ( thumbSize > 100 )
      {
        thumbSize = 100;
      }
      else if ( thumbSize < 0 )
      {
        thumbSize = 0;
      }

      if ( this.options.direction === 'vertical' )
      {
        this.dom.thumb.css({
          height: thumbSize + '%'
        });
      }
      else{
        this.dom.thumb.css({
          width: thumbSize + '%'
        });
      }
    },

    _fixScrollBarScrollPosition: function( element )
    {
      var delta
          wrapper = this.dom.wrapper,
          scroller = this.dom.scroller
          ;

      if ( this.options.direction === 'vertical' )
      {
        delta = scroller.height() - wrapper.height();

        if ( delta < wrapper.scrollTop() )
        {
          if ( delta < 0 )
          {
            delta = 0;
          }
          wrapper.scrollTop( delta );
        }
      }
      else{
        delta = scroller.width() - wrapper.width();

        if ( delta < wrapper.scrollLeft() )
        {
          if ( delta < 0 )
          {
            delta = 0;
          }
          wrapper.scrollLeft( delta );
        }
      }
    },


    _disableSelection: function()
    {
      this.$document.attr('unselectable', 'on')
                    .css('user-select', 'none')
                    .on('selectstart', false);
    },


    _enableSelection: function()
    {
      this.$document.removeAttr('unselectable')
                    .css('user-select', 'auto')
                    .off('selectstart', false);
    },


    _lockContainerScroll: function( event )
    {
      event.preventDefault();
      this.dom.container.scrollLeft(0);
      this.dom.container.scrollTop(0);    
      return false;  
    }


  };


  /* ***********************************************************************************
   * jQuery plugin
   * *********************************************************************************** */


  $.fn.flatScroll = function( options )
  {
    // if $(selector).flatScroll('string') call that method on the instance
    if ( typeof options === 'string' )
    {
      this.each(function(){
        var instance = $.data( this, 'flatScroll' );
        if ( !instance ) {
          window.console.error('Cannot call "'+options+'" before initialisation.');
          return;
        }
        if ( !$.isFunction( instance[options] ) ) {
          window.console.error( "no such method '"+options+"' on flatScroll instance." );
          return;
        }
        instance[ options ].apply( instance ); //call options() with instance as this
      });
    }
    else{
      this.each(function(){
        var instance = $.data( this, 'flatScroll' );
        if ( instance )
        {
          instance._init( options );
        }
        else{
          $.data(this, 'flatScroll', new $.FlatScroll( options, this ));
        }
      });
    }

    return this;
  };

})(jQuery);