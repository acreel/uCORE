/**
 * Class: KmlJsonGeoData
 * 
 * Dependencies:
 *   - jQuery
 *   - core.geo.GeoData
 *   - core.util.CallbackUtils
 *   - core.geo.KmlFeatureType
 *   - core.geo.GeoDataStore
 */

if (!window.core)
	window.core = {};
if (!window.core.geo)
	window.core.geo = {};

(function($, ns) {
	var GeoData = core.geo.GeoData;
	if (!GeoData)
		throw "Dependency not found: core.geo.GeoData";
	var CallbackUtils = core.util.CallbackUtils;
	if (!CallbackUtils)
		throw "Dependency not found - core.util.CallbackUtils";
	var KmlFeatureType = core.geo.KmlFeatureType;
	if (!KmlFeatureType)
		throw "Dependency not found - core.geo.KmlFeatureType";
	var GeoDataStore = core.geo.GeoDataStore;
	if (!GeoDataStore)
		throw "Dependency not found: core.geo.GeoDataStore";

	var getKmlFeatureTypeFromJson = function(kmlJsonType) {
		if (kmlJsonType) {
			switch (kmlJsonType) {
			case "NetworkLink":
				return KmlFeatureType.NETWORK_LINK;
			case "Placemark":
				return KmlFeatureType.PLACEMARK;
			case "PhotoOverlay":
				return KmlFeatureType.PHOTO_OVERLAY;
			case "ScreenOverlay":
				return KmlFeatureType.SCREEN_OVERLAY;
			case "GroundOverlay":
				return KmlFeatureType.GROUND_OVERLAY;
			case "Folder":
				return KmlFeatureType.FOLDER;
			case "Document":
				return KmlFeatureType.DOCUMENT;
			}
		}
		return null;
	};

	var KmlJsonGeoData = function(id, kmlJsonObj, kmlRoot, parentGeoData) {
		GeoData.call(this, id);
		this.kmlJsonObj = kmlJsonObj;
		this.kmlRoot = kmlRoot;
		this.parentGeoData = parentGeoData;
	};
	
	KmlJsonGeoData.ID_PROPERTY = "_coreId";
	
	KmlJsonGeoData.hasId = function(kmlJsonObj) {
		return kmlJsonObj && KmlJsonGeoData.ID_PROPERTY in kmlJsonObj;
	};
	
	KmlJsonGeoData.getId = function(kmlJsonObj) {
		if (kmlJsonObj && KmlJsonGeoData.ID_PROPERTY in kmlJsonObj) {
			return kmlJsonObj[KmlJsonGeoData.ID_PROPERTY];
		}
		return undefined;
	};
	
	KmlJsonGeoData.setId = function(kmlJsonObj, id) {
		if (kmlJsonObj)
			kmlJsonObj[KmlJsonGeoData.ID_PROPERTY] = id;
	};
	
	KmlJsonGeoData.fromKmlJson = function(kmlJson, kmlRoot, parent) {
		if (!parent)
			parent = null;
		var id = KmlJsonGeoData.getId(kmlJson);
		return new KmlJsonGeoData(id, kmlJson, kmlRoot, parent);
	};
	
	$.extend(KmlJsonGeoData.prototype, GeoData.prototype, {
		kmlJsonObj: null,
		
		kmlRoot: null,

		parentGeoData: null,
		
		/**
		 * Function: findByKmlFeatureType
		 * 
		 * Finds all descendants that represent a certain KML feature (i.e. 
		 * Placemark, NeworkLink). Callback is invoked once per descendant.
		 * 
		 * Parameters:
		 *   kmlFeatureType - String. Required. KML feature type. See 
		 *         <KmlFeatureType>.
		 *   callback - Function. Invoked for each matching descendant. 
		 *         Invoked with one parameter of type <GeoData>, which is 
		 *         the descendant.
		 *         
		 */
		findByKmlFeatureType: function(kmlFeatureType, callback) {
			if (this.kmlJsonObj && "children" in this.kmlJsonObj) {
				for (var i = 0; i < this.kmlJsonObj.children.length; i++) {
					var child = this.kmlJsonObj.children[i];
					if ("type" in child 
						&& getKmlFeatureTypeFromJson(child.type) === kmlFeatureType) {
						var kmlJsonChild = KmlJsonGeoData.fromKmlJson(child);
						if (CallbackUtils.invokeCallback(callback, kmlJsonChild) === false
							|| kmlJsonChild.findByKmlFeatureType(kmlFeatureType, callback) === false) {
							// stop searching
							return false;
						}
					}
				}
			}
		},
		
		/**
		 * Function: getKmlFeatureType
		 * 
		 * Determines the name of the type of KML feature 
		 * represented by this object (i.e. Placemark). 
		 * This name must be one of the valid element 
		 * names that extend the KML Feature element.
		 * 
		 * Returns:
		 *   String. KML feature type name.
		 */
		getKmlFeatureType: function() {
			if (this.kmlJsonObj && "type" in this.kmlJsonObj) 
				return getKmlFeatureTypeFromJson(this.kmlJsonObj.type);
			return null;
		},

		/**
		 * Function: getName
		 * 
		 * Retrieves this feature's name.
		 * 
		 * Returns:
		 *   String. Feature's name (title).
		 */
		getName: function() {
			if (this.kmlJsonObj && this.kmlJsonObj.name) {
				return this.kmlJsonObj.name;
			}
			if (!this.parentGeoData) {
				// This is the root. Use the filename from the KML URL.
				if (this.kmlRoot && this.kmlRoot.baseUrl) {
					var slash = this.kmlRoot.baseUrl.lastIndexOf('/');
					var end = this.kmlRoot.baseUrl.indexOf('.', slash + 1);
					if (end == -1)
						end = this.kmlRoot.baseUrl.length();
					return this.kmlRoot.baseUrl.substring(slash + 1, end);
				}
			}
			return null;
		},

		/**
		 * Function: hasChildren
		 * 
		 * Returns true if this node contains children.
		 * 
		 * Returns:
		 *   Boolean. True if this feature contains children.
		 */
		hasChildren: function() {
			return (this.kmlJsonObj && (
					("children" in this.kmlJsonObj && this.kmlJsonObj.children.length > 0)
					|| (getKmlFeatureTypeFromJson(this.kmlJsonObj.type) === KmlFeatureType.NETWORK_LINK)));
		},

		/**
		 * Function: getParent
		 * 
		 * Retrieves the parent <GeoData> instance.
		 * 
		 * Returns:
		 *  <GeoData>. Parent node.
		 */
		getParent: function() {
			return this.parentGeoData;
		},
		
		/**
		 * Function: iterateChildren
		 * 
		 * Iterates over the child <GeoData> nodes of this <GeoData> node.
		 * 
		 * Parameters:
		 *   callback - Function. Function invoked for each child <GeoData> 
		 *         node. A single parameter is passed to the function - a 
		 *         <GeoData> instance that is the current child node.
		 */
		iterateChildren: function(callback) {
			if (this.kmlJsonObj && "children" in this.kmlJsonObj) {
				for (var i = 0; i < this.kmlJsonObj.children.length; i++) {
					var child = this.kmlJsonObj.children[i];
					var kmlJsonChild = KmlJsonGeoData.fromKmlJson(child, this);
					GeoDataStore.persist(kmlJsonChild);
					if (CallbackUtils.invokeCallback(callback, kmlJsonChild) === false) {
						// stop iterating
						return false;
					}
				}
			}
		},
		
		/**
		 * Function: getChildById
		 * 
		 * Retrieves a child <GeoData> node by its ID.
		 * 
		 * Parameters:
		 *   id - String. ID of the child node.
		 *   
		 * Returns:
		 *   <GeoData>. The child node, or null if it doesn't exist.
		 */
		getChildById: function(id) {
			if (this.kmlJsonObj && "children" in this.kmlJsonObj) {
				for (var i = 0; i < this.kmlJsonObj.children.length; i++) {
					var child = this.kmlJsonObj.children[i];
					// no need to search deeper in the tree if this node 
					// doesn't have an ID set
					if (KmlJsonGeoData.hasId(child)) {
						var childKmlJsonGeoData = KmlJsonGeoData.fromKmlJson(child, this);
						if (childKmlJsonGeoData.id === id) {
							return childKmlJsonGeoData;
						}
						else {
							var descendant = childKmlJsonGeoData.getChildById(id);
							if (descendant) {
								return descendant;
							}
						}
					}
				}
			}
			return null;
		},
		
		getKmlJson: function(callback) {
			CallbackUtils.invokeCallback(callback, this.kmlJsonObj);
		},
		
		removeAllChildren: function() {
			if (this.kmlJsonObj && "children" in this.kmlJsonObj) {
				this.kmlJsonObj.children = [];
				GeoDataStore.persist(this);
			}
		},

		addChild: function(childKmlJsonObj) {
			if (!("children" in this.kmlJsonObj)
					|| !this.kmlJsonObj.children 
					|| !("push" in this.kmlJsonObj.children)) {
				this.kmlJsonObj.children = [];
			}
			this.kmlJsonObj.children.push(childKmlJsonObj);
		},
		
		/**
		 * Function: postSave
		 * 
		 * Invoked by GeoDataStore after the ID is set.
		 * Sets the <KmlJsonGeoData> ID on the KML JSON object.
		 * 
		 * See Also:
		 *   <GeoDataStore.persist>
		 */
		postSave: function() {
			KmlJsonGeoData.setId(this.kmlJsonObj, this.id);
		},
		
		getKmlString: function() {
			throw "Not implemented";
		}
	});
	
	ns.KmlJsonGeoData = KmlJsonGeoData;
})(jQuery, window.core.geo);