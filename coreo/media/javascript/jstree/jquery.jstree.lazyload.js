/**
 * loadChildren:
 *   data = {
 *       attr: Object.
 *       metadata: Object.
 *       state: String. CSS class suffix for jsTree state.
 *       title: String. Text or HTML for node name.
 *       icon: String. CSS class name.
 *   }
 */
(function ($) {
	$.jstree.plugin("lazyload", {
		defaults : { 
			data : false,
			loadChildren: function(obj, dataFn, completeFn, errorFn) {}
		},
		_fn : {
			load_node : function (obj, s_call, e_call) {
				var _this = this;
				var s = this._get_settings().lazyload;
				var parentNode = this._get_node(obj);
				if (!parentNode) {
					return;
				}
				var isRoot = (parentNode === -1);
				if (isRoot) {
					parentNode = this.get_container().children("ul");
					if (parentNode.length === 0) {
						var ul = $("<ul>");
						ul.appendTo(this.get_container());
						parentNode = ul;
					}
					else {
						parentNode.empty();
					}
				}
				else {
					if (parentNode.data("jstree-is-loading")) { 
						return;
					}
					else {
						parentNode.data("jstree-is-loading",true);
						var ul = $("<ul>");
						parentNode.append(ul);
						parentNode = ul;
					}					
				}
				
				var dataCallback = function(data) {
					var childNode = $("<li>");
					if (data) {
						if (data.attr) {
							childNode.attr(data.attr);
						}
						if (data.metadata) {
							childNode.data("jstree", data.metadata);
						}
						if (data.state) {
							if ($.isArray(data.state)) {
								$.each(data.state, function(idx, state) {
									childNode.addClass("jstree-" + state);
								});								
							}
							else {
								childNode.addClass("jstree-" + data.state);
							}
						}
						var title = $("<a>").attr("href", "#")[_this._get_settings().core.html_titles ? "html" : "text"](data.title);
						childNode.append("<ins class='jstree-icon'>&#160;</ins>");
						childNode.append(title);
						if (data.icon) {
							childNode.children("ins").addClass(data.icon);
						}
					}
					parentNode.append(childNode);
				};
				var completeCallback = function() {
					if (!isRoot) {
						parentNode.data("jstree-is-loading", false);
						parentNode.removeClass("jstree-loading");
						var children = parentNode.children("li");
						if (children.length > 0) {
							children.data("jstree-is-loading", false);
							children.each(function() {
								_this.clean_node(this);
							});
						}
						else {
							parentNode.closest("li").find(".jstree-loading").removeClass("jstree-loading");
							parentNode.closest("li").removeClass("jstree-closed").addClass("jstree-open");
						}
					}
					_this.__callback({"obj": obj});
					if(s_call) {
						s_call.call(_this);
					}
				};
				if (isRoot) {
					dataCallback(s.data);
					completeCallback();
				}
				else {
					s.loadChildren(obj, dataCallback, completeCallback, e_call);
				}
			},
			_is_loaded: function(obj) {
				return obj == -1 || !obj || obj.is(".jstree-open, .jstree-leaf") 
					|| obj.children("ul").children("li").size() > 0;
			},
			/*
			_get_children: function(obj) {
				alert("get_children(" + obj + ")");
			}
			*/
			/*
			_is_loaded : function (obj) { 
				var s = this._get_settings().json_data, d;
				obj = this._get_node(obj); 
				if(obj && obj !== -1 && s.progressive_render && !obj.is(".jstree-open, .jstree-leaf") && obj.children("ul").children("li").length === 0 && obj.data("jstree-children")) {
					d = this._parse_json(obj.data("jstree-children"));
					if(d) {
						obj.append(d);
						$.removeData(obj, "jstree-children");
					}
					this.clean_node(obj);
					return true;
				}
				return obj == -1 || !obj || !s.ajax || obj.is(".jstree-open, .jstree-leaf") || obj.children("ul").children("li").size() > 0;
			},
			load_node_json : function (obj, s_call, e_call) {
				var s = this.get_settings().json_data, d,
					error_func = function () {},
					success_func = function () {};
				obj = this._get_node(obj);
				if(obj && obj !== -1) {
					if(obj.data("jstree-is-loading")) { return; }
					else { obj.data("jstree-is-loading",true); }
				}
				switch(!0) {
					case (!s.data && !s.loadChildren): throw "Neither data nor loadChildren settings supplied.";
					case (!!s.data && !s.loadChildren) || (!!s.data && !!s.loadChildren && (!obj || obj === -1)):
						if(!obj || obj == -1) {
							d = this._parse_json(s.data);
							if(d) {
								this.get_container().children("ul").empty().append(d.children());
								this.clean_node();
							}
							else { 
								if(s.correct_state) { this.get_container().children("ul").empty(); }
							}
						}
						if(s_call) { s_call.call(this); }
						break;
					case (!s.data && !!s.loadChildren) || (!!s.data && !!s.loadChildren && obj && obj !== -1):
						error_func = function (x, t, e) {
							if(obj != -1 && obj.length) {
								obj.children(".jstree-loading").removeClass("jstree-loading");
								obj.data("jstree-is-loading",false);
								if(t === "success" && s.correct_state) { obj.removeClass("jstree-open jstree-closed").addClass("jstree-leaf"); }
							}
							else {
								if(t === "success" && s.correct_state) { this.get_container().children("ul").empty(); }
							}
							if(e_call) { e_call.call(this); }
						};
						success_func = function (d, t, x) {
							var sf = this.get_settings().json_data.ajax.success; 
							if(sf) { d = sf.call(this,d,t,x) || d; }
							if(d === "" || (!$.isArray(d) && !$.isPlainObject(d))) {
								return error_func.call(this, x, t, "");
							}
							d = this._parse_json(d);
							if(d) {
								if(obj === -1 || !obj) { this.get_container().children("ul").empty().append(d.children()); }
								else { obj.append(d).children(".jstree-loading").removeClass("jstree-loading"); obj.data("jstree-is-loading",false); }
								this.clean_node(obj);
								if(s_call) { s_call.call(this); }
							}
							else {
								if(obj === -1 || !obj) {
									if(s.correct_state) { 
										this.get_container().children("ul").empty(); 
										if(s_call) { s_call.call(this); }
									}
								}
								else {
									obj.children(".jstree-loading").removeClass("jstree-loading");
									obj.data("jstree-is-loading",false);
									if(s.correct_state) { 
										obj.removeClass("jstree-open jstree-closed").addClass("jstree-leaf"); 
										if(s_call) { s_call.call(this); } 
									}
								}
							}
						};
						s.ajax.context = this;
						s.ajax.error = error_func;
						s.ajax.success = success_func;
						if(!s.ajax.dataType) { s.ajax.dataType = "json"; }
						if($.isFunction(s.ajax.url)) { s.ajax.url = s.ajax.url.call(this, obj); }
						if($.isFunction(s.ajax.data)) { s.ajax.data = s.ajax.data.call(this, obj); }
						$.ajax(s.ajax);
						
						var dataCallback = function(data) {
							
						};
						var completCallback = function() {
							
						};
						var errorCallback = function(errorThrown) {
							
						};
						s.loadChildren(obj, dataCallback, completeCallback, 
								errorCallback);
						
						break;
				}
			},
			_parse_json : function (js, is_callback) {
				var d = false, 
					p = this._get_settings(),
					s = p.json_data,
					t = p.core.html_titles,
					tmp, i, j, ul1, ul2;

				if(!js) { return d; }
				if($.isFunction(js)) { 
					js = js.call(this);
				}
				if($.isArray(js)) {
					d = $();
					if(!js.length) { return false; }
					for(i = 0, j = js.length; i < j; i++) {
						tmp = this._parse_json(js[i], true);
						if(tmp.length) { d = d.add(tmp); }
					}
				}
				else {
					if(typeof js == "string") { js = { data : js }; }
					if(!js.data && js.data !== "") { return d; }
					d = $("<li>");
					if(js.attr) { d.attr(js.attr); }
					if(js.metadata) { d.data("jstree", js.metadata); }
					if(js.state) { d.addClass("jstree-" + js.state); }
					if(!$.isArray(js.data)) { tmp = js.data; js.data = []; js.data.push(tmp); }
					$.each(js.data, function (i, m) {
						tmp = $("<a>");
						if($.isFunction(m)) { m = m.call(this, js); }
						if(typeof m == "string") { tmp.attr('href','#')[ t ? "html" : "text" ](m); }
						else {
							if(!m.attr) { m.attr = {}; }
							if(!m.attr.href) { m.attr.href = '#'; }
							tmp.attr(m.attr)[ t ? "html" : "text" ](m.title);
							if(m.language) { tmp.addClass(m.language); }
						}
						tmp.prepend("<ins class='jstree-icon'>&#160;</ins>");
						if(!m.icon && js.icon) { m.icon = js.icon; }
						if(m.icon) { 
							if(m.icon.indexOf("/") === -1) { tmp.children("ins").addClass(m.icon); }
							else { tmp.children("ins").css("background","url('" + m.icon + "') center center no-repeat"); }
						}
						d.append(tmp);
					});
					d.prepend("<ins class='jstree-icon'>&#160;</ins>");
					if(js.children) { 
						if(s.progressive_render && js.state !== "open") {
							d.addClass("jstree-closed").data("jstree-children", js.children);
						}
						else {
							if($.isFunction(js.children)) {
								js.children = js.children.call(this, js);
							}
							if($.isArray(js.children) && js.children.length) {
								tmp = this._parse_json(js.children, true);
								if(tmp.length) {
									ul2 = $("<ul>");
									ul2.append(tmp);
									d.append(ul2);
								}
							}
						}
					}
				}
				if(!is_callback) {
					ul1 = $("<ul>");
					ul1.append(d);
					d = ul1;
				}
				return d;
			},
			get_json : function (obj, li_attr, a_attr, is_callback) {
				var result = [], 
					s = this._get_settings(), 
					_this = this,
					tmp1, tmp2, li, a, t, lang;
				obj = this._get_node(obj);
				if(!obj || obj === -1) { obj = this.get_container().find("> ul > li"); }
				li_attr = $.isArray(li_attr) ? li_attr : [ "id", "class" ];
				if(!is_callback && this.data.types) { li_attr.push(s.types.type_attr); }
				a_attr = $.isArray(a_attr) ? a_attr : [ ];

				obj.each(function () {
					li = $(this);
					tmp1 = { data : [] };
					if(li_attr.length) { tmp1.attr = { }; }
					$.each(li_attr, function (i, v) { 
						tmp2 = li.attr(v); 
						if(tmp2 && tmp2.length && tmp2.replace(/jstree[^ ]*|$/ig,'').length) {
							tmp1.attr[v] = tmp2.replace(/jstree[^ ]*|$/ig,''); 
						}
					});
					if(li.hasClass("jstree-open")) { tmp1.state = "open"; }
					if(li.hasClass("jstree-closed")) { tmp1.state = "closed"; }
					a = li.children("a");
					a.each(function () {
						t = $(this);
						if(
							a_attr.length || 
							$.inArray("languages", s.plugins) !== -1 || 
							t.children("ins").get(0).style.backgroundImage.length || 
							(t.children("ins").get(0).className && t.children("ins").get(0).className.replace(/jstree[^ ]*|$/ig,'').length)
						) { 
							lang = false;
							if($.inArray("languages", s.plugins) !== -1 && $.isArray(s.languages) && s.languages.length) {
								$.each(s.languages, function (l, lv) {
									if(t.hasClass(lv)) {
										lang = lv;
										return false;
									}
								});
							}
							tmp2 = { attr : { }, title : _this.get_text(t, lang) }; 
							$.each(a_attr, function (k, z) {
								tmp1.attr[z] = (t.attr(z) || "").replace(/jstree[^ ]*|$/ig,'');
							});
							$.each(s.languages, function (k, z) {
								if(t.hasClass(z)) { tmp2.language = z; return true; }
							});
							if(t.children("ins").get(0).className.replace(/jstree[^ ]*|$/ig,'').replace(/^\s+$/ig,"").length) {
								tmp2.icon = t.children("ins").get(0).className.replace(/jstree[^ ]*|$/ig,'').replace(/^\s+$/ig,"");
							}
							if(t.children("ins").get(0).style.backgroundImage.length) {
								tmp2.icon = t.children("ins").get(0).style.backgroundImage.replace("url(","").replace(")","");
							}
						}
						else {
							tmp2 = _this.get_text(t);
						}
						if(a.length > 1) { tmp1.data.push(tmp2); }
						else { tmp1.data = tmp2; }
					});
					li = li.find("> ul > li");
					if(li.length) { tmp1.children = _this.get_json(li, li_attr, a_attr, true); }
					result.push(tmp1);
				});
				return result;
			}
			*/
		}
	});
})(jQuery);