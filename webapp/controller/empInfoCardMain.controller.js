sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Controller, MessageToast) {
	"use strict";
	
	return Controller.extend("solus.empinfocard.controller.empInfoCardMain", {
		onInit: function () {
			if (!jQuery.support.touch) {
				this.getView().addStyleClass("sapUiSizeCompact");
			}
			this.nullstring = ""; //Null값일때 나오는 문자
			const photoPath = jQuery.sap.getModulePath("solus.empinfocard") + "/image/"; //이미지경로
		
			// Loading create
			this.busyDialog = new sap.m.BusyDialog({
				text: "Loading...",
				customIconWidth: "60px",
				customIconHeight: "60px",
				customIcon: photoPath + "loading.gif",
				customIconDensityAware: false
			});
			this.getView().setModel(new sap.ui.model.json.JSONModel());
		},
		
		onAfterRendering: function () {
			this.init();
		},

		init: function () {
			this.deletePage();
			this.initUser();
			// this.handleDialogPress();
		},
		
		/**
		 * 최초 로그인사용자 호출
		 */ 
		initUser: function() {
			// 1528458 , 320195
			(async() => {
				this.busyDialog.open();
				let oViewModel = this.getView().getModel();
				let oEmpData = await this.setAddInfo("1528458");
				oViewModel.setProperty("/empInfos", [oEmpData]);
				this.busyDialog.close();
			})();
		},

		/**
		 * User에 따른 정보를 불러와 ViewData를 생성한다.
		 * UserId : 유저정보
		 */ 
		setAddInfo: async function (UserId) {
			return new Promise((resolve, reject) => {
				const oViewModel = this.getView().getModel();
				// const oEmpInfos = oViewModel.getProperty("/empInfos");
				const photoPath = jQuery.sap.getModulePath("solus.empinfocard") + "/image/"; //이미지경로
				const sUserID = UserId; 
				const sUserLang = navigator.language || navigator.userLanguage;
				(async() => {
					const sPhotoPath = await this.getPhoto(sUserID);			 //사진정보
					const sLogoPath = photoPath+"Logo_solus.jpg";				 //로고
					const oUserInfo = await this.getUser(sUserID);				 //유저정보 
					const oEmployeeClass = await this.getEmployeeClass(sUserID); //경력사항 
					const oEducation = await this.getEducation(sUserID);		 //학력정보 
					const oFamilyInfo = await this.getFamilyInfo(sUserID);		 //가족사항
					let oEmpJobNew = "";										 //발령사항
					let oEmpJobOld = await this.getEmpJobOLD(sUserID);			 //이전발령사항
					let sVBox1 = "60%";
					let sVBox2 = "40%";
					switch (sUserLang) { //접속Language에 따라 가족사항 호출
						case 'en':
							oEmpJobNew = await this.getEmpJobUS(sUserID);
							sVBox1 = "50%";
							sVBox2 = "50%";
							break;
						case 'zh':
							oEmpJobNew = await this.getEmpJobCN(sUserID);
							break;
						default:
							oEmpJobNew = await this.getEmpJobKR(sUserID);
							break;
					}
					const oEmpJob = await this.setEmpJob(oEmpJobOld, oEmpJobNew, sUserLang); //현재 + 이전(발령사항을 합친다)
					let sGender = "", sFirstName = "", sLastName = "", sLL1 = "", sLL2 = "", sLL3 = "", sLL4 = "", sLL5 = "", sLR1 = "", 
					    sLR2 = "", sLR3 = "", sLR4 = "", sBusinessPhone = "", sCellPhone = "", sHomePhone = "", sAddress = "";
					    
					if (oUserInfo) { // 유저정보 있을경우 Make Data
						sGender = this.checkGender(oUserInfo.gender);
						sFirstName = oUserInfo.firstName;
						sLastName = oUserInfo.lastName;
						sLL1 = oUserInfo.jobCode;
						sLL2 = this.onChangeMainListLabel(oUserInfo.custom01Nav) + " / " + oUserInfo.custom12 + " / " + this.onChangeMainListLabel(oUserInfo.custom11Nav) + " / " + this.onChangeMainListLabel(oUserInfo.custom10Nav);
						sLL3 = oUserInfo.department;
						sLL4 = oUserInfo.custom08;
						sLL5 = this.getMultiDateTime(oUserInfo.dateOfBirth) + " (" + sGender + ", " + this.checkElapsedDay(oUserInfo.dateOfBirth,"Age") + ") / " + this.onChangeInfoStatus(oUserInfo.status);
						sLR1 = this.getMultiDateTime(oUserInfo.hireDate) + " (" + this.checkElapsedDay(oUserInfo.hireDate) + ")";
						sLR2 = oUserInfo.custom13 + " (" + this.checkElapsedDay(oUserInfo.custom13, "Date") + ")";
						sLR3 = oUserInfo.custom03 + " (" + this.checkElapsedDay(oUserInfo.custom03, "Date") + ")";
						sLR4 = oUserInfo.custom14 + " (" + this.checkElapsedDay(oUserInfo.custom14, "Date") + ")";
						sBusinessPhone = oUserInfo.businessPhone,
						sCellPhone = oUserInfo.cellPhone,
						sHomePhone = oUserInfo.homePhone,
						sAddress = "("+oUserInfo.addressLine1+") "+oUserInfo.state+" "+oUserInfo.addressLine2+" "+oUserInfo.addressLine3;
					}
					
					let oCareerSet = [];
					if (oEmployeeClass && oEmployeeClass.length) { //경력사항 있을경우 Make Data
						 oCareerSet = oEmployeeClass;
					}
					let oEducationSet = [];
					if (oEducation && oEducation.length) { //학력정보 있을경우 Make Data
						 oEducationSet = oEducation;
						 oEducationSet.map(person => (person["UserLang"] = sUserLang));
					}
					let oFamilyInfoSet = [];
					if (oFamilyInfo && oFamilyInfo.length) { //가족사항 있을경우 Make Data
						oFamilyInfoSet = this.setFamilyInfo(oFamilyInfo, sUserLang);
					}
					let oIssuanceHistorySet = [];
					if(oEmpJob && oEmpJob.length) {	//발령사항 있을경우 Make Data
						oIssuanceHistorySet = oEmpJob;
					}
					
					//ViewData를 생성
					const oViewDatas = { 
					    logo    		  : sLogoPath,			//로고
						img				  : sPhotoPath, 		//사진
						firstName		  : sFirstName, 		//한글이름
						lastName		  : sLastName,  		//영어이름
						lL1				  : sLL1,				//상단라인1
						lL2				  : sLL2,				//상단라인2
						lL3				  : sLL3,				//상단라인3
						lL4				  : sLL4,				//상단라인4
						lL5				  : sLL5,				//상단라인5
						lR1				  : sLR1,				//회사입사일 
						lR2				  : sLR2,				//최초입사일 
						lR3				  : sLR3,				//소속발령일 
						lR4				  : sLR4,				//직위발령일
						businessPhone	  : sBusinessPhone, 	//회사전화
						cellPhone		  : sCellPhone,			//휴대전화 
						homePhone		  : sHomePhone,			//집전화 
						address 		  : sAddress,			//현주소 
						careerSet		  : oCareerSet, 		//경력사항
						educationSet	  : oEducationSet,		//학력정보
						familyInfoSet     : oFamilyInfoSet,		//가족사항
						IssuanceHistorySet: oIssuanceHistorySet,//발령사항
						vWidth1  		  : sVBox1,				//상단VBox레이아웃1
						vWidth2			  : sVBox2				//상단VBox레이아웃2
					};
					resolve(oViewDatas)
				})();
			});
		},
		
		/**
		 * 발령사항을 셋팅함
		 * oEmpJobOld : 이전발령사항
		 * oEmpJobNew : 발령사항
		 * sUserLang  : 접속Language
		 */ 
		setEmpJob: function(oEmpJobOld, oEmpJobNew, sUserLang) {
			let aEmpJobDatas = [];
			for(let i=0; i<oEmpJobOld.length; i++) {
				let sOldReason = "";
				let sOldEmployeeType = "";
				let sJobGroup = "";
				if(oEmpJobOld[i].reasonNav) {
					if(oEmpJobOld[i].reasonNav.picklistLabels) sOldReason = oEmpJobOld[i].reasonNav.picklistLabels.results;
				}
				if(oEmpJobOld[i].employeeGroupNav) {
					if(oEmpJobOld[i].employeeGroupNav.picklistLabels) sOldEmployeeType = oEmpJobOld[i].employeeGroupNav.picklistLabels.results;
				}
				if(oEmpJobOld[i].jobGroupNav) {
					if(oEmpJobOld[i].jobGroupNav.picklistLabels) sJobGroup = oEmpJobOld[i].jobGroupNav.picklistLabels.results;
				}
				aEmpJobDatas.push({
					actionDate   : this.getMultiDateTime(oEmpJobOld[i].actionDate),  				 //발령일자
					reason	     : this.getLocaleLabel(sOldReason),									 //발령사유
					orgUnit      : oEmpJobOld[i].orgUnit,											 //소속
					employeeType : this.getLocaleLabel(sOldEmployeeType),							 //사원유형
					jobGroup     : this.getLocaleLabel(sJobGroup),									 //직군
					position     : oEmpJobOld[i].title,												 //직위/직책
					sjf 		 : "",																 //SJF
					company 	 : oEmpJobOld[i].company,											 //회사
				})
			};
			for(let j=0; j<oEmpJobNew.length; j++) {
				let sReason = "", sOrgUnit = "", sEmployeeType = "", sJobGroup = "", sPosition1 = "", sPosition2 = "", sSjf = "", sCompany = "";
				if(sUserLang === 'en') {
					if(oEmpJobNew[j].eventReasonNav) {
						if(oEmpJobNew[j].eventReasonNav.nameTranslationNav) sReason = oEmpJobNew[j].eventReasonNav.nameTranslationNav.value_en_US;
					}
					if(oEmpJobNew[j].employeeClassNav) {
						if(oEmpJobNew[j].employeeClassNav.picklistLabels) sEmployeeType = oEmpJobNew[j].employeeClassNav.picklistLabels.results;
					}
					if(oEmpJobNew[j].customString2Nav) {
						if(oEmpJobNew[j].customString2Nav.picklistLabels) sJobGroup = oEmpJobNew[j].customString2Nav.picklistLabels.results;
					}
					if(oEmpJobNew[j].departmentNav) sOrgUnit = oEmpJobNew[j].departmentNav.name_en_US;
					if(oEmpJobNew[j].jobCodeNav) sSjf = oEmpJobNew[j].jobCodeNav.name_en_US;
					if(oEmpJobNew[j].companyNav) sCompany = oEmpJobNew[j].companyNav.name_en_US;
					if(oEmpJobNew[j].customString6Nav) sPosition1 = oEmpJobNew[j].customString6Nav.externalName_en_US;
					if(oEmpJobNew[j].customString7Nav) sPosition2 = "/"+oEmpJobNew[j].customString7Nav.externalName_en_US;
				} else if(sUserLang === 'zh') {
					if(oEmpJobNew[j].eventReasonNav) {
						if(oEmpJobNew[j].eventReasonNav.nameTranslationNav) sReason = oEmpJobNew[j].eventReasonNav.nameTranslationNav.value_zh_CN
					}
					if(oEmpJobNew[j].employeeClassNav) {
						if(oEmpJobNew[j].employeeClassNav.picklistLabels) sEmployeeType = oEmpJobNew[j].employeeClassNav.picklistLabels.results;
					}
					if(oEmpJobNew[j].customString2Nav) {
						if(oEmpJobNew[j].customString2Nav.picklistLabels) sJobGroup = oEmpJobNew[j].customString2Nav.picklistLabels.results;
					}
					if(oEmpJobNew[j].departmentNav) sOrgUnit = oEmpJobNew[j].departmentNav.name_zh_CN;
					if(oEmpJobNew[j].jobCodeNav) sSjf = oEmpJobNew[j].jobCodeNav.name_zh_CN;
					if(oEmpJobNew[j].companyNav) sCompany = oEmpJobNew[j].companyNav.name_zh_CN;
					if(oEmpJobNew[j].customString6Nav) sPosition1 = oEmpJobNew[j].customString6Nav.externalName_zh_CN;
					if(oEmpJobNew[j].customString7Nav) sPosition2 = "/"+oEmpJobNew[j].customString7Nav.externalName_zh_CN;
				} else {
					if(oEmpJobNew[j].eventReasonNav){
						if(oEmpJobNew[j].eventReasonNav.nameTranslationNav) sReason = oEmpJobNew[j].eventReasonNav.nameTranslationNav.value_ko_KR
					}
					if(oEmpJobNew[j].employeeClassNav){
						if(oEmpJobNew[j].employeeClassNav.picklistLabels) sEmployeeType = oEmpJobNew[j].employeeClassNav.picklistLabels.results;
					}
					if(oEmpJobNew[j].customString2Nav){
						if(oEmpJobNew[j].customString2Nav.picklistLabels) sJobGroup = oEmpJobNew[j].customString2Nav.picklistLabels.results;
					}
					if(oEmpJobNew[j].departmentNav) sOrgUnit = oEmpJobNew[j].departmentNav.name_ko_KR;
					if(oEmpJobNew[j].jobCodeNav) sSjf = oEmpJobNew[j].jobCodeNav.name_ko_KR;
					if(oEmpJobNew[j].companyNav) sCompany = oEmpJobNew[j].companyNav.name_ko_KR;
					if(oEmpJobNew[j].customString6Nav) sPosition1 = oEmpJobNew[j].customString7Nav.externalName_ko_KR;
					if(oEmpJobNew[j].customString7Nav) sPosition2 = "/"+oEmpJobNew[j].customString7Nav.externalName_ko_KR;
				}
				
				aEmpJobDatas.push({
						actionDate   : this.getMultiDateTime(oEmpJobNew[j].startDate),					//발령일자
						reason	     : sReason,															//발령사유
						orgUnit      : sOrgUnit,														//소속
						employeeType : this.getLocaleLabel(sEmployeeType),								//사원유형
						jobGroup     : this.getLocaleLabel(sJobGroup),									//직군
						position     : sPosition1 + sPosition2,											//직위/직책
						sjf 		 : sSjf,															//SJF
						company 	 : sCompany, 														//회사
				})
			}
			
			return aEmpJobDatas;
		},
		
		/**
		 * 가족정보를 셋팅
		 * oFamilyInfo : 가족정보
		 * sUserLang : 접속Language
		 */ 
		setFamilyInfo: function(oFamilyInfo, sUserLang) {
			let aFamilyInfoDatas = [];
			for(let i=0; i<oFamilyInfo.length; i++) {
				let sName = "";
				if(sUserLang === "ko") {
					sName = oFamilyInfo[i].firstName
				} else {
					sName = oFamilyInfo[i].lastName
				}
				let sRelationship = "" ,sBirthDate = "" ,sAge = "" ,sGender = "";
				if(oFamilyInfo[i].relationshipTypeNav){
					if(oFamilyInfo[i].relationshipTypeNav.picklistLabels) sRelationship = oFamilyInfo[i].relationshipTypeNav.picklistLabels.results;
				}
				if(oFamilyInfo[i].relPersonNav) sBirthDate = oFamilyInfo[i].relPersonNav.dateOfBirth;
				if(oFamilyInfo[i].relPersonNav) sAge = oFamilyInfo[i].relPersonNav.dateOfBirth;
				if(oFamilyInfo[i].relPersonalNav) sGender = oFamilyInfo[i].relPersonalNav.gender;
				aFamilyInfoDatas.push({
					relationship   : this.getLocaleLabel(sRelationship), //관계
					name	       : sName,								 //성명
					birthDate      : this.getMultiDateTime(sBirthDate),	 //생년월일
					age 		   : this.checkElapsedDay(sAge,"Age"),	 //나이
					gender  	   : sGender,							 //성별
				
				})
			};
			return aFamilyInfoDatas;
		},
		
		
		/**
		 * pdf 생성
		 */ 
		printPDF: function () {
			this.busyDialog.open();
			let deferreds = [];
			let doc = new jsPDF('p', 'mm');
		    var that = this;

			$(".childPrintBox").each(function (number) {
				let deferred = $.Deferred();
				//if( i == 0 ) {
				deferreds.push(deferred.promise());
				html2canvas(this, {
					imageTimeout: 3000,
					scale: 1.25
				}).then(function (canvas) {
					// 캔버스를 이미지로 변환
					let imgData = canvas.toDataURL('image/png');
					let imgWidth = 210; // 이미지 가로 길이(mm) A4 기준
					let pageHeight = imgWidth * 1.414; // 출력 페이지 세로 길이 계산 A4 기준
					let imgHeight = canvas.height * imgWidth / canvas.width;
					let heightLeft = imgHeight;
					let position = 0;

					// 첫 페이지 출력
					if (number > 0) doc.addPage();
					doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
					heightLeft -= pageHeight;

					// 한 페이지 이상일 경우 루프 돌면서 출력
					while (heightLeft >= 20) {
						position = heightLeft - imgHeight;
						doc.addPage();
						doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
						heightLeft -= pageHeight;
					}
					deferred.resolve();
				});
			});

			$.when.apply($, deferreds).then(function () { // executes after adding all images
				let today = new Date();
				let year  = today.getFullYear();  // 년도
				let month = today.getMonth() + 1; // 월
				let date  = today.getDate();	  // 날짜
				let hours = today.getHours();     // 시
				let minutes = today.getMinutes(); // 분
				let seconds = today.getSeconds(); // 초
				let milliseconds = today.getMilliseconds(); // 밀리
				doc.save('인사카드_' + (year + "" + month + "" + date + "_" + hours + "" + minutes + "" + seconds + "" + milliseconds) + '.pdf');
				that.busyDialog.close();
			});

		},
		
		/**
		 * 페이지 초기화/삭제
		 */ 
		deletePage: function () {
			this.byId("empinfobox").destroyItems();
		},

		//<------------------------------------------------ 사원검색 Start-------------------------------------------------------------------------
		handleLiveChange: function (oEvent) {
			let oTextArea = oEvent.getSource(),
				iValueLength = oTextArea.getValue().length,
				iMaxLength = oTextArea.getMaxLength(),
				sState = iValueLength > iMaxLength ? "Warning" : "None";

			oTextArea.setValueState(sState);
		},

		_handleValueHelpSearch: function (evt) {
			let sValue = evt.getParameter("value");
			// if (sValue.length > 1) {
				this.searchUserName(sValue);
			// } else {
			// 	this.getView().setModel(new sap.ui.model.json.JSONModel(), "user");
			// }
		},

		_handleValueHelpClose: function (evt) {
			let aContexts = evt.getParameter("selectedContexts");
			let returnVal = new Array();
			if (aContexts && aContexts.length) {
				aContexts.map(function (oContext) {
					returnVal.push(oContext.getObject());
				});
			}
			(async() => {
				if (returnVal.length > 0) {
					this.deletePage();
					let oViewModel = this.getView().getModel();
					this.busyDialog.open();
					oViewModel.setProperty("/empInfos", null);
					for (let i = 0; i < returnVal.length; i++) {
						let oEmpData = await this.setAddInfo(returnVal[i].personIdExternal)
						if (i === 0) {
							oViewModel.setProperty("/empInfos", [oEmpData]);
							this.busyDialog.close();
						} else {
							let oEmpInfos = oViewModel.getProperty("/empInfos");
							oEmpInfos.push(oEmpData);
							oViewModel.setProperty("/empInfos", oEmpInfos);
						}
					}

				}
			})();
			evt.getSource().getBinding("items").filter([]);
		},

		_handleValueLiveChange: function (evt) {},

		handleDialogPress: function () {
			let userData = new Array();
			let userJson = new sap.ui.model.json.JSONModel();
			userJson.setData(userData);
			this.getView().setModel(userJson, "user");
			let sMent = this.onChangeMent();

			if (!this._oSelDialog) {
				this._oSelDialog = sap.ui.xmlfragment("solus.empinfocard.view.fragment.Dialog", this);
				this._oSelDialog.setMultiSelect(true);
				// this._oSelDialog._oOkButton.mProperties.text = "선택";
				// this._oSelDialog._oCancelButton.mProperties.text = "닫기";
				this._oSelDialog.getAggregation("_dialog").getSubHeader().getContentMiddle()[0].setPlaceholder(sMent);
				this.getView().addDependent(this._oSelDialog);
				
			}

			// user 데이터 가져오기 		
			
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSelDialog);
			this._oSelDialog.open();
		},

		// 입력한 유저이름의 데이터를 조회
		searchUserName: function (sValue) {
			this.busyDialog.open();
			let oModel = this.getOwnerComponent().getModel("SFModel");
			let oViewModel = this.getView().getModel();
			let InputFilter = new sap.ui.model.Filter({
				filters: [
					new sap.ui.model.Filter("username", "Contains", sValue.toUpperCase()),
					new sap.ui.model.Filter("firstName", "Contains", sValue.toUpperCase()),
					new sap.ui.model.Filter("lastName", "Contains", sValue.toUpperCase())
				],
				and: false
			});

			oModel.read("/User", {
				filters: [InputFilter,new sap.ui.model.Filter("empInfo/isContingentWorker", "EQ", false)],
				urlParameters: "$select=userId,username,firstName,custom05,custom03,department,division,personKeyNav/personIdExternal&$top=10&$expand=personKeyNav",
				success: (oData, response) => {
					if (oData && oData.results && oData.results.length) {
						let userArray = new Array();
						for (let i = 0; i < oData.results.length; i++) {
							userArray.push({
								user: oData.results[i].userId,
								firstName: oData.results[i].firstName,
								custom05: oData.results[i].custom05,
								custom03: oData.results[i].custom03,
								department: this.removeCode(oData.results[i].department),
								division: this.removeCode(oData.results[i].division),
								personIdExternal :  oData.results[i].personKeyNav.personIdExternal
							});
						}
						let userJson = new sap.ui.model.json.JSONModel();
						userJson.setData({
							ProductCollection: userArray
						});
						this.getView().setModel(userJson, "user");
					}
					this.busyDialog.close();
				},
				error: (oError) => {
					MessageToast.show("사원 조회 시 에러 발생 : 담당자에게 문의해주세요.");
					this.busyDialog.close();
				}
			});
		},
		//------------------------------------------------- 사원검색 END----------------------------------------------------------------------->


		//<------------------------------------------------ GET DATA START----------------------------------------------------------------------
		// user: userID를 받아 SF에서 데이터를 가져온다 
		
		/**
		 * 사진정보 가져오기 
		 */
		getPhoto: function (user) {
			return new Promise((resolve, reject) => {
				let sPhotoPath = jQuery.sap.getModulePath("solus.empinfocard") + "/image/" + "photoNotAvailable.gif";
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("userId", "EQ", user),
						new sap.ui.model.Filter("photoType", "EQ", "20")
					],
					and: true
				});
				oModel.read("/Photo", {
					filters: [InputFilter],
					urlParameters: `$select=photo,photoId,photoName&$format=json`,
					success: (oData, response) => {
						if (oData && oData.results && oData.results.length) {
							sPhotoPath = "data:image/bmp;base64," + oData.results[0].photo;
						}
						resolve(sPhotoPath);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},

		/**
		 * 사용자 데이터 가져오기
		 */
		getUser: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("empInfo/isContingentWorker", "EQ", false),
						// new sap.ui.model.Filter("empInfo/empGlobalAssignmentNav", "EQ",  null),
						new sap.ui.model.Filter("personKeyNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/User", {
					filters: [InputFilter],
					urlParameters: `$select=personKeyNav/personIdExternal,firstName,lastName,homePhone,cellPhone,businessPhone,state,addressLine1,addressLine2,
					addressLine3,custom13,custom14,status,jobCode,custom08,department,custom01,custom10,custom12,status,custom03,hireDate,
					origHireDate,dateOfBirth,gender,custom02,custom01Nav/picklistLabels,custom11Nav/picklistLabels,custom10Nav/picklistLabels
					&$expand=personKeyNav,empInfo,custom01Nav/picklistLabels,custom11Nav/picklistLabels,
					custom10Nav/picklistLabels&$format=json`,
					success: (oData, response) => {
						let returnData = null;
						if (oData && oData.results && oData.results.length) {
							returnData = oData.results[0];
						}
						resolve(returnData);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},

		/**
		 * 학력
		 */
		getEducation: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("externalCodeNav/personKeyNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/cust_Education_Emp", {
					filters: [InputFilter],
					urlParameters: `$format=json&$select=externalCodeNav/personKeyNav/personIdExternal,cust_Education/cust_EndDate,
					cust_Education/startDate,cust_Education/cust_country,cust_Education/cust_major,cust_Education/cust_submajor,
					cust_Education/cust_Institute/externalName,cust_Education/cust_Certificate,cust_Education/cust_CertificateNav,
					cust_Education,cust_Education/cust_Institute,cust_Education/cust_Institute/cust_countryNav,cust_Education/cust_majorNav,
					cust_Education/cust_submajorNav&$expand=externalCodeNav/personKeyNav,cust_Education,cust_Education/cust_Institute,
					cust_Education/cust_CertificateNav,cust_Education/cust_Institute/cust_countryNav,cust_Education/cust_Institute/cust_countryNav,
					cust_Education/cust_majorNav,cust_Education/cust_submajorNav`,
					success: (oData, response) => {
						let returnData = null;
						if (oData && oData.results && oData.results.length) {
							if (oData.results[0].cust_Education && oData.results[0].cust_Education.results && oData.results[0].cust_Education.results.length) {
								returnData = oData.results[0].cust_Education.results;
							}
						}
						resolve(returnData);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},

		/**
		 * 경력사항
		 */
		getEmployeeClass: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("externalCodeNav/personKeyNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/cust_PreviousEmployment_EMP", {
					filters: [InputFilter],
					urlParameters: `$format=json&$select=externalCodeNav/personKeyNav/personIdExternal,cust_toPreviousEmployment/startDate,cust_toPreviousEmployment/endDate,
					cust_toPreviousEmployment/cust_positionGroup,cust_toPreviousEmployment/cust_department,cust_toPreviousEmployment/cust_employer,
					cust_toPreviousEmployment/cust_jobCode,cust_toPreviousEmployment/cust_jobCodeNav/name_localized&$expand=externalCodeNav/personKeyNav,cust_toPreviousEmployment,cust_toPreviousEmployment/cust_jobCodeNav`,
					success: (oData, response) => {
						let returnData = null;
						if (oData && oData.results && oData.results.length) {
							returnData = oData.results[0].cust_toPreviousEmployment.results;
						}
						resolve(returnData);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},
		
		/**
		 * 가족사항
		 */
		getFamilyInfo: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("personNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/PerPersonRelationship", {
					filters: [InputFilter],
					urlParameters: `$format=json&$select=relationshipTypeNav/localeLabel,firstName,lastName,relPersonalNav/gender,relPersonNav/dateOfBirth,
					relationshipTypeNav/picklistLabels/label,relationshipTypeNav/picklistLabels/locale&$expand=relationshipTypeNav, personNav, relPersonalNav, 
					relPersonNav,relationshipTypeNav/picklistLabels`,
					success: (oData, response) => {
						let returnData = null;
						if (oData && oData.results && oData.results.length) {
							returnData = oData.results;
						}
						resolve(returnData);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},
		
		/**
		 * 발령이력(2019.10.01 이전)
		 */
		getEmpJobOLD: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("userIdNav/personKeyNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/Background_InsideWorkExperience", {
					filters: [InputFilter],
					urlParameters: `fromDate=1900-01-01&$format=json&$select=actionDate,orgUnit,company,title,employeeGroupNav/picklistLabels,jobGroupNav/picklistLabels,reasonNav/picklistLabels&
					$expand=employeeGroupNav/picklistLabels,jobGroupNav/picklistLabels,reasonNav/picklistLabels,userIdNav/personKeyNav`,
					success: (oData, response) => {
						resolve(oData.results);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},

		/**
		 * 발령이력(한국어)
		 */
		getEmpJobKR: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("employmentNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/EmpJob", {
					filters: [InputFilter],
					urlParameters: `$format=json&$expand=eventReasonNav/nameTranslationNav,companyNav,customString6Nav,customString7Nav,jobCodeNav,employeeClassNav/picklistLabels,departmentNav,
					customString2Nav/picklistLabels&$select=startDate,companyNav/name_ko_KR,eventReasonNav/nameTranslationNav/value_ko_KR,departmentNav/name_ko_KR,customString7Nav/externalName_ko_KR,
					customString6Nav/externalName_ko_KR,jobCodeNav/name_ko_KR,employeeClassNav/picklistLabels , customString2Nav/picklistLabels&fromDate=1900-01-01`,
					success: (oData, response) => {
						resolve(oData.results);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},
		
		/**
		 * 발령이력(중국어)
		 */
		getEmpJobCN: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("employmentNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/EmpJob", {
					filters: [InputFilter],
					urlParameters: `fromDate=1900-01-01&$format=json&$select=startDate,companyNav/name_zh_CN,eventReasonNav/nameTranslationNav/value_zh_CN,departmentNav/name_zh_CN,
					customString7Nav/externalName_zh_CN,customString6Nav/externalName_zh_CN,jobCodeNav/name_zh_CN,employeeClassNav/picklistLabels,customString2Nav/picklistLabels&
					$expand=eventReasonNav/nameTranslationNav,companyNav,customString6Nav,customString7Nav,jobCodeNav,employeeClassNav/picklistLabels,departmentNav,customString2Nav/picklistLabels`,
					success: (oData, response) => {
						resolve(oData.results);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},
		
		/**
		 * 발령이력(영어)
		 */
		getEmpJobUS: function (user) {
			return new Promise((resolve, reject) => {
				let oModel = this.getOwnerComponent().getModel("SFModel");
				let oViewModel = this.getView().getModel();
				let InputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("employmentNav/personIdExternal", "EQ", user)
					],
					and: true
				});
				oModel.read("/EmpJob", {
					filters: [InputFilter],
					urlParameters: `fromDate=1900-01-01&$format=json&$select=startDate,companyNav/name_en_US,eventReasonNav/nameTranslationNav/value_en_US,departmentNav/name_en_US,
					customString7Nav/externalName_en_US,customString6Nav/externalName_en_US,jobCodeNav/name_en_US,employeeClassNav/picklistLabels,customString2Nav/picklistLabels&
					$expand=eventReasonNav/nameTranslationNav,companyNav,customString6Nav,customString7Nav,jobCodeNav,employeeClassNav/picklistLabels,departmentNav,customString2Nav/picklistLabels`,
					success: (oData, response) => {
						resolve(oData.results);
					},
					error: (oError) => {
						reject(oError);
					}
				});
			});
		},
		
		//------------------------------------------------------GET DATA END------------------------------------------------------------------>
		
		//<------------------------------------------------ Utills Start-----------------------------------------------------------------------
		
		/**
		 * 카드상단 이미지 우측 리스트정보 추출
		 * oData : 리스트 정보
		 */ 
		onChangeMainListLabel: function(oData) {
			const userLang = navigator.language || navigator.userLanguage;
			let sRetunLabel = "";
			if (oData && oData.picklistLabels && oData.picklistLabels.results && oData.picklistLabels.results.length) {
				let aLabelDatas = oData.picklistLabels.results;
				for(let i=0; i<aLabelDatas.length; i++){
					if(aLabelDatas[i].locale.split("_")[0] === userLang){
						sRetunLabel = aLabelDatas[i].label;
					}
				}
			}
			return sRetunLabel;
		},
		
		/**
		 * Locale에따른 라벨정보 추출
		 * aDatas : 라벨정보
		 */ 
		getLocaleLabel: function(aDatas){
			let userLang = navigator.language || navigator.userLanguage;
			let sLocale = "";
			let sLabel = "";
			if(aDatas && aDatas.length) {
				switch (userLang) {
					case 'en':
						sLocale = "en_US";
						break;
					case 'zh':
						sLocale = "zh_CN";
						break;
					default:
						sLocale = "ko_KR";
						break;
				}
				for(let i=0; i<aDatas.length; i++) {
					if(aDatas[i].locale === sLocale) {
						sLabel =  aDatas[i].label;
					}
				}
			}
			return sLabel;
		},
		
		/**
		 * Locale에따른 성별
		 * sGender : 성별코드
		 */ 
		checkGender: function (sGender) {
			if(!sGender || sGender === "") return "";
			let userLang = navigator.language || navigator.userLanguage;
			let vGender = "";
			if (sGender === "F") {
				switch (userLang) {
				case 'en':
					vGender = "Female";
					break;
				case 'zh':
					vGender = "女";
					break;
				default:
					vGender = "여";
					break;
				}
			} else {
				switch (userLang) {
				case 'en':
					vGender = "Male";
					break;
				case 'zh':
					vGender = "男";
					break;
				default:
					vGender = "남";
					break;
				}
			}
			return vGender;
		},
		
		/**
		 * Locale에따른 사원검색 placeHolder 문구
		 */ 
		onChangeMent: function () {
			let userLang = navigator.language || navigator.userLanguage;
			let sMent = "";
			switch (userLang) {
				case 'en':
					sMent = "Please enter at least 2 characters.";
					break;
				case 'zh':
					sMent = "请输入至少 2 个字符。";
					break;
				default:
					sMent = "2자 이상 입력해주세요.";
					break;
			}
			return sMent;
		},
		
		/**
		 * Locale에따른 재직상태정보
		 * sStat : 재직상태코드
		 */ 
		onChangeInfoStatus: function (sStat) {
			if(!sStat || sStat === "" ) return "";
			let userLang = navigator.language || navigator.userLanguage;
			let sReturnTxt = "";
			if (sStat === "t") {
				switch (userLang) {
				case 'en':
					sReturnTxt = "Active";
					break;
				case 'zh':
					sReturnTxt = "在职";
					break;
				default:
					sReturnTxt = "재직";
					break;
				}
			} else {
				switch (userLang) {
				case 'en':
					sReturnTxt = "inactive";
					break;
				case 'zh':
					sReturnTxt = "离职";
					break;
				default:
					sReturnTxt = "퇴직";
					break;
				}
			}
			return sReturnTxt;
		},

		/**
		 * 날자차이 , 나이계산
		 * fromDay : 시작일
		 * type : (Age:나이 , Date: 날자)
		 */
		checkElapsedDay: function (fromDay, type) {
			if(!fromDay || fromDay === "" ) return "";
			let vFromDay = "";
			if (type === "Date") {
				vFromDay = new Date(fromDay);
			} else {
				vFromDay = fromDay;
			}
			let toDay = new Date();
			let elapsed = toDay.getTime() - vFromDay.getTime();
			let elapsedDay = elapsed / 1000 / 60 / 60 / 24; // 두날짜의 차이 일수 
			let year = "";
			let month = "";
			let day = "";
			let sReturnTxt = "";
			let userLang = navigator.language || navigator.userLanguage;
			if (type === "Age") {
				year = Math.floor(elapsedDay / 365);
				month = Math.floor((elapsedDay - (year * 365)) / 30)
				if (userLang === "ko") {
					sReturnTxt = year + '세';
				} else {
					sReturnTxt = year;
				}
				return sReturnTxt;
			}
			if (elapsedDay < 30) {
				day = elapsedDay;
				if (userLang === "ko") {
					sReturnTxt = day + '일';
				} else {
					sReturnTxt = day + 'Day';
				}
				return sReturnTxt;
			} else if (elapsedDay < 365) {
				month = Math.floor(elapsedDay / 30);
				if (userLang === "ko") {
					sReturnTxt = month + '개월';
				} else {
					sReturnTxt = month + 'Month';
				}
				return sReturnTxt;
			} else {
				year = Math.floor(elapsedDay / 365);
				month = Math.floor((elapsedDay - (year * 365)) / 30)
				if (userLang === "ko") {
					sReturnTxt = year + '년 ' + month + '개월';
				} else {
					sReturnTxt = year + 'Year ' + month + 'Month';
				}
				return sReturnTxt;
			}
		},

		/**
		 * JSon Date 변환
		 * date : 날짜정보
		 */
		getMultiDateTime: function (date) {
			if(!date || date === "" ) return "";
			let value = date;
			let formatted = "";
			formatted = value.getFullYear() + "-" +
				("0" + (value.getMonth() + 1)).slice(-2) + "-" +
				("0" + value.getDate()).slice(-2);
			return formatted;
		},

		/**
		 * 마지막 괄호 삭제 : 마지막 괄호가 코드가 있다는 전재 
		 */
		removeCode: function (code) {
			let changecode = null;
			if (code != null && code != "") {
				if (code.lastIndexOf("(") >= 0) {
					changecode = code.substring(0, code.lastIndexOf("("));
					if (code.lastIndexOf(")") >= 0) {
						if ((code.lastIndexOf(")") + 1) != code.length && code.lastIndexOf("(") < code.lastIndexOf(")"))
							changecode += code.substring(code.lastIndexOf(")") + 1, code.length);
					}
				} else {
					changecode = code;
				}
			}
			return changecode;
		},
		
		getParameter: function () {
			let url = location.search; // 주소 ? 다음부터 나옴
			let qs = url.substring(url.indexOf('?') + 1).split('&');
			for (let i = 0, result = {}; i < qs.length; i++) {
				qs[i] = qs[i].split('=');
				result[qs[i][0]] = decodeURIComponent(qs[i][1]);
			}
			return result;
		}
		//------------------------------------------------- Utills END------------------------------------------------------------------------->
	
	});
});