sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"solus/empinfocard/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("solus.empinfocard.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			var userLang = navigator.language || navigator.userLanguage;
			sap.ui.getCore().getConfiguration().setLanguage(userLang);
			
			// window["sap-ui-config"].language = userLang;
			
			var oSFModel = new sap.ui.model.odata.v2.ODataModel("/SAPIN_SF_TEST/odata/v2/", {
				json: true,
				useBatch: false,
				defaultUpdateMethod: "PUT",
				defaultCountMode: "None"
			});
			this.setModel(oSFModel, "SFModel");

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},		
		
		getContentDensityClass : function () {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		
		/**
		 * OData 호출시(read, update, create) 오류가 발생 시 오류 메세지를 추출하여 오류 메세지를 출력한다.
		 */
		displayErrorMessage: function(oError) {
            var vErrorMsg = "시스템 오류입니다. 관리자에게 문의 바랍니다.";
			var vDetailMsg = "";
            if (oError && oError.responseText) {
                if (oError.responseText.indexOf("<?xml") >= 0) {
                    var xmlparser = new DOMParser();
                    var xmldata = xmlparser.parseFromString(oError.responseText, "text/xml");
                    var vErrors = xmldata.getElementsByTagName("error");
                    if (vErrors && vErrors.length) {
                        var vMessageTag = vErrors[0].getElementsByTagName("message");
                        if (vMessageTag && vMessageTag.length) {
                            vDetailMsg = vMessageTag[0].childNodes[0].nodeValue;
                        }
                    }
                } else {
                    var oErrorInfo = JSON.parse(oError.responseText);
                    if (oErrorInfo.error && oErrorInfo.error.message) {
                        vErrorMsg = oErrorInfo.error.message.value;
                    }
                }
            }
            
            sap.m.MessageBox.alert(vErrorMsg, {
                title: "오류",
                details: vDetailMsg
			});
		}
	});
});