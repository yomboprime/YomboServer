/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2016 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global','sap/ui/base/Object','./TableUtils'],function(q,B,T){"use strict";var _=function(c,t){var o=sap.ui.require(t);return o&&(c instanceof o);};var a=B.extend("sap.ui.table.TableExtension",{constructor:function(t,s){B.call(this);this._table=t;this._settings=s||{};this._type=a.TABLETYPES.STANDARD;if(_(t,"sap/ui/table/TreeTable")){this._type=a.TABLETYPES.TREE;}else if(_(t,"sap/ui/table/AnalyticalTable")){this._type=a.TABLETYPES.ANALYTICAL;}var n=this._init(this._table,this._type,this._settings);if(n){var b=this;t["_get"+n]=function(){return b;};}},destroy:function(){this._table=null;this._type=null;B.prototype.destroy.apply(this,arguments);},getInterface:function(){return this;}});a.TABLETYPES={TREE:"TREE",ANALYTICAL:"ANALYTICAL",STANDARD:"STANDARD"};a.prototype.getTable=function(){return this._table;};a.prototype._init=function(t,s,S){return null;};a.enrich=function(t,e,s){if(!e||!(e.prototype instanceof a)){return null;}var E=new e(t,s);return E;};return a;});
