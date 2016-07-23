/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2016 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global','sap/ui/core/Control','sap/ui/core/ResizeHandler','./library'],function(q,C,R,l){"use strict";var S=l.SelectionBehavior,N=l.NavigationMode,a=l.SelectionMode;var T={CELLTYPES:{DATACELL:"DATACELL",COLUMNHEADER:"COLUMNHEADER",ROWHEADER:"ROWHEADER",COLUMNROWHEADER:"COLUMNROWHEADER"},hasRowHeader:function(t){return t.getSelectionMode()!==a.None&&t.getSelectionBehavior()!==S.RowOnly;},isNoDataVisible:function(t){return t.getShowNoData()&&!t._getRowCount();},getNoDataText:function(t){var n=t.getNoData();if(n instanceof C){return null;}else{if(typeof n==="string"||t.getNoData()instanceof String){return n;}else{return t._oResBundle.getText("TBL_NO_DATA");}}},getVisibleColumnCount:function(t){return t._getVisibleColumnCount();},getRowHeightByIndex:function(t,r){var i=0;if(t){var b=t.getRows();if(b&&b.length&&r>-1&&r<b.length){var d=b[r].getDomRefs();if(d){if(d.rowScrollPart&&d.rowFixedPart){i=Math.max(d.rowScrollPart.clientHeight,d.rowFixedPart.clientHeight);}else if(!d.rowFixedPart){i=d.rowScrollPart.clientHeight;}}}}return i;},isVariableRowHeightEnabled:function(t){return t._bVariableRowHeightEnabled&&t.getNavigationMode()===N.Scrollbar&&t.getFixedRowCount()<=0&&t.getFixedBottomRowCount()<=0;},getTotalRowCount:function(t,i){var r=t._getRowCount();if(i){r=Math.max(r,t.getVisibleRowCount());}return r;},getFocusedItemInfo:function(t){var i=t._getItemNavigation();if(!i){return null;}return{cell:i.getFocusedIndex(),columnCount:i.iColumns,cellInRow:i.getFocusedIndex()%i.iColumns,row:Math.floor(i.getFocusedIndex()/i.iColumns),cellCount:i.getItemDomRefs().length,domRef:i.getFocusedDomRef()};},getColumnIndexOfFocusedCell:function(t){var i=T.getFocusedItemInfo(t);return i.cellInRow-(T.hasRowHeader(t)?1:0);},getRowIndexOfFocusedCell:function(t){var i=T.getFocusedItemInfo(t);return i.row-t._getHeaderRowCount();},isInGroupingRow:function(c){var i=T.getCellInfo(c);if(i&&i.type===T.CELLTYPES.DATACELL){return i.cell.parent().hasClass("sapUiTableGroupHeader");}else if(i&&i.type===T.CELLTYPES.ROWHEADER){return i.cell.hasClass("sapUiTableGroupHeader");}return false;},isInSumRow:function(c){var i=T.getCellInfo(c);if(i&&i.type===T.CELLTYPES.DATACELL){return i.cell.parent().hasClass("sapUiAnalyticalTableSum");}else if(i&&i.type===T.CELLTYPES.ROWHEADER){return i.cell.hasClass("sapUiAnalyticalTableSum");}return false;},isFixedColumn:function(t,c){return c<t.getFixedColumnCount();},hasFixedColumns:function(t){return t.getFixedColumnCount()>0;},focusItem:function(t,i,e){var I=t._getItemNavigation();if(I){I.focusItem(i,e);}},getCellInfo:function(c){if(!c){return null;}var $=q(c);if($.hasClass("sapUiTableTd")){return{type:T.CELLTYPES.DATACELL,cell:$};}else if($.hasClass("sapUiTableCol")){return{type:T.CELLTYPES.COLUMNHEADER,cell:$};}else if($.hasClass("sapUiTableRowHdr")){return{type:T.CELLTYPES.ROWHEADER,cell:$};}else if($.hasClass("sapUiTableColRowHdr")){return{type:T.CELLTYPES.COLUMNROWHEADER,cell:$};}return null;},getRowColCell:function(t,r,c){var o=t.getRows()[r];var b=t._getVisibleColumns()[c];var d=o&&o.getCells()[c];if(d&&d.data("sap-ui-colid")!=b.getId()){var e=o.getCells();for(var i=0;i<e.length;i++){if(e[i].data("sap-ui-colid")===b.getId()){d=e[i];break;}}}return{row:o,column:b,cell:d};},registerResizeHandler:function(t,i,h,r){var d;if(typeof i=="string"){d=t.getDomRef(i);}else{q.sap.log.error("sIdSuffix must be a string",t);return;}if(typeof h!=="function"){q.sap.log.error("fnHandler must be a function",t);return;}this.deregisterResizeHandler(t,i);if(!t._mResizeHandlerIds){t._mResizeHandlerIds={};}if(r&&d){d=d.parentNode;}if(d){t._mResizeHandlerIds[i]=R.register(d,h);}return t._mResizeHandlerIds[i];},deregisterResizeHandler:function(t,I){var b;if(!t._mResizeHandlerIds){return;}if(typeof I=="string"){b=[I];}else if(I===undefined){b=[];for(var k in t._mResizeHandlerIds){if(typeof k=="string"&&t._mResizeHandlerIds.hasOwnProperty(k)){b.push(k);}}}else if(q.isArray(I)){b=I;}for(var i=0;i<b.length;i++){var s=b[i];if(t._mResizeHandlerIds[s]){R.deregister(t._mResizeHandlerIds[s]);t._mResizeHandlerIds[s]=undefined;}}},scroll:function(t,d,p){var p=t.getNavigationMode()===N.Scrollbar?p:true;var s=false;var r=t._getRowCount();var v=t.getVisibleRowCount();var i=v-t.getFixedRowCount()-t.getFixedBottomRowCount();var f=t._getSanitizedFirstVisibleRow();var b=p?i:1;if(d){if(f+v<r){t.setFirstVisibleRow(Math.min(f+b,r-v));s=true;}}else{if(f>0){t.setFirstVisibleRow(Math.max(f-b,0));s=true;}}return s;},isFirstScrollableRow:function(t,r){var $=q(r);var i=parseInt($.add($.parent()).filter("[data-sap-ui-rowindex]").attr("data-sap-ui-rowindex"),10);var f=t.getFixedRowCount()||0;return i==f;},isLastScrollableRow:function(t,r){var $=q(r);var i=parseInt($.add($.parent()).filter("[data-sap-ui-rowindex]").attr("data-sap-ui-rowindex"),10);var f=t.getFixedBottomRowCount()||0;return i==t.getVisibleRowCount()-f-1;}};return T;},true);