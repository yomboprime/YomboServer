/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2016 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global',"sap/ui/core/Control",'sap/ui/core/Renderer'],function(q,C,R){"use strict";var O=C.extend("sap.m.ObjectMarker",{metadata:{library:"sap.m",properties:{type:{type:"sap.m.ObjectMarkerType",group:"Misc"},visibility:{type:"sap.m.ObjectMarkerVisibility",group:"Misc"}},aggregations:{_innerControl:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"}},events:{press:{type:{type:"sap.m.ObjectMarkerType"}}}}});var r=sap.ui.getCore().getLibraryResourceBundle("sap.m");O.M_PREDEFINED_TYPES={Flagged:{icon:{src:"sap-icon://flag",visibility:{small:true,large:true}},text:{value:r.getText("OM_FLAG"),visibility:{small:false,large:false}}},Favorite:{icon:{src:"sap-icon://favorite",visibility:{small:true,large:true}},text:{value:r.getText("OM_FAVORITE"),visibility:{small:false,large:false}}},Draft:{icon:{src:"sap-icon://request",visibility:{small:true,large:true}},text:{value:r.getText("OM_DRAFT"),visibility:{small:false,large:true}}},Locked:{icon:{src:"sap-icon://private",visibility:{small:true,large:true}},text:{value:r.getText("OM_LOCKED"),visibility:{small:false,large:true}}},Unsaved:{icon:{src:"sap-icon://user-edit",visibility:{small:false,large:true}},text:{value:r.getText("OM_UNSAVED"),visibility:{small:true,large:true}}}};O.prototype.init=function(){sap.ui.Device.media.initRangeSet("DeviceSet",[600],"px",["small","large"]);};O.prototype.onAfterRendering=function(){sap.ui.Device.media.attachHandler(this._handleMediaChange,this,"DeviceSet");};O.prototype.onBeforeRendering=function(){this._cleanup();};O.prototype.exit=function(){this._cleanup();};O.prototype.attachPress=function(){var i=this._getInnerControl();Array.prototype.unshift.apply(arguments,["press"]);C.prototype.attachEvent.apply(this,arguments);if(this.hasListeners("press")&&i&&i instanceof b){i.destroy();this.setAggregation("_innerControl",this._createCustomLink(),true);this._adjustControl();}return this;};O.prototype.detachPress=function(){var i=this._getInnerControl();Array.prototype.unshift.apply(arguments,["press"]);C.prototype.detachEvent.apply(this,arguments);if(!this.hasListeners("press")&&i&&i instanceof d){i.destroy();this.setAggregation("_innerControl",this._createCustomText(),true);this._adjustControl();}return this;};O.prototype.setVisibility=function(v){this.setProperty("visibility",v);this._adjustControl();return this;};O.prototype.setType=function(t){this.setProperty("type",t);this._adjustControl();return this;};O.prototype._cleanup=function(){sap.ui.Device.media.detachHandler(this._handleMediaChange,this,"DeviceSet");};O.prototype._handleMediaChange=function(){this._adjustControl();};O.prototype._adjustControl=function(){var t=O.M_PREDEFINED_TYPES[this.getType()],i=this._getInnerControl();if(this._isIconVisible()){i.setIcon(t.icon.src);this.addStyleClass("sapMObjectMarkerIcon");}else{i.setIcon(null);this.removeStyleClass("sapMObjectMarkerIcon");}if(this._isTextVisible()){i.setTooltip(null);i.setText(t.text.value);this.addStyleClass("sapMObjectMarkerText");}else{if(i.getIcon()){i.setTooltip(t.text.value);}i.setText(null);this.removeStyleClass("sapMObjectMarkerText");}};O.prototype._isIconVisible=function(){var t=O.M_PREDEFINED_TYPES[this.getType()],v=this.getVisibility(),D=this._getDeviceType(),T=t&&t.icon.visibility[D]||false;return v===sap.m.ObjectMarkerVisibility.IconOnly||v===sap.m.ObjectMarkerVisibility.IconAndText||(v!==sap.m.ObjectMarkerVisibility.TextOnly&&T);};O.prototype._isTextVisible=function(){var t=O.M_PREDEFINED_TYPES[this.getType()],v=this.getVisibility(),D=this._getDeviceType(),T=t&&t.text.visibility[D]||false;return v===sap.m.ObjectMarkerVisibility.TextOnly||v===sap.m.ObjectMarkerVisibility.IconAndText||(v!==sap.m.ObjectMarkerVisibility.IconOnly&&T);};O.prototype._getDeviceType=function(){return sap.ui.Device.media.getCurrentRange("DeviceSet").name.toLowerCase();};O.prototype._getInnerControl=function(){var i=this.getAggregation("_innerControl");if(!i&&this.getType()){i=this._createInnerControl();this.setAggregation("_innerControl",i,true);this._adjustControl();}return i;};O.prototype._createInnerControl=function(){if(this.hasListeners("press")){return this._createCustomLink();}else{return this._createCustomText();}};O.prototype._createCustomLink=function(){var o=new d(this.getId()+"-link",{wrapping:true});o.attachPress(function(e){this.firePress({type:this.getType()});},this);return o;};O.prototype._createCustomText=function(){return new b(this.getId()+"-text");};var a=R.extend(sap.m.TextRenderer);a.renderText=function(o,e){o.renderControl(e._getIconAggregation());sap.m.TextRenderer.renderText(o,e);};var b=sap.m.Text.extend("CustomText",{metadata:{properties:{icon:{type:"sap.ui.core.URI",group:"Data",defaultValue:null}},aggregations:{_iconControl:{type:"sap.ui.core.Icon",multiple:false,visibility:"hidden"}}},renderer:a});b.prototype.setIcon=function(i){var I=this._getIconAggregation();this.setProperty("icon",i,false);I.setSrc(i);};b.prototype._getIconAggregation=function(){var i=this.getAggregation("_iconControl");if(!i){i=new sap.ui.core.Icon();this.setAggregation("_iconControl",i);}return i;};b.prototype.setText=function(t){this.setProperty("text",t,true);};var c=R.extend(sap.m.LinkRenderer);c.renderText=function(o,e){o.renderControl(e._getIconAggregation());sap.m.LinkRenderer.renderText(o,e);};var d=sap.m.Link.extend("CustomLink",{metadata:{properties:{icon:{type:"sap.ui.core.URI",group:"Data",defaultValue:null}},aggregations:{_iconControl:{type:"sap.ui.core.Icon",multiple:false,visibility:"hidden"}}},renderer:c});d.prototype.setIcon=function(i){var I=this._getIconAggregation();this.setProperty("icon",i,false);I.setSrc(i);};d.prototype._getIconAggregation=function(){var i=this.getAggregation("_iconControl");if(!i){i=new sap.ui.core.Icon();this.setAggregation("_iconControl",i);}return i;};d.prototype.setText=function(t){this.setProperty("text",t,true);};return O;},true);
