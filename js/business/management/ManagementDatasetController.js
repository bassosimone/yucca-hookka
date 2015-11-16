appControllers.controller('ManagementDatasetListCtrl', [ '$scope', '$route', '$location', 'fabricAPImanagement', 'info', function($scope, $route, $location, fabricAPImanagement, info, filterFilter) {
	$scope.tenantCode = $route.current.params.tenant_code;
	$scope.showLoading = true;

	$scope.datasetList = [];
	$scope.filteredDatasetsList = [];
	$scope.nameFilter = null;
	$scope.statusFilter = null;

	$scope.currentPage = 1;
	$scope.pageSize = 10;
	$scope.totalItems = $scope.datasetList.length;
	$scope.predicate = '';

	console.log("isOwner", info.isOwner( $scope.tenantCode));
	console.log("info", info);

	$scope.isOwner = function(){
		return info.isOwner( $scope.tenantCode);
	};

	fabricAPImanagement.getDatasets($scope.tenantCode).success(function(response) {
		$scope.showLoading = false;

		$scope.datasetList = [];
		if(response!=null){
			for (var i = 0; i <response.length; i++) {
				if(response[i].configData && response[i].configData.subtype && response[i].configData.subtype!='binaryDataset'){
					
					if(!response[i].info  || response[i].info ==null)
						response[i].info ={};
	
					if(!response[i].info.icon || response[i].info.icon == null)
						response[i].info.icon  = "img/dataset-icon-default.png";

					if(response[i].info.binaryIdDataset || response[i].info.binaryIdDataset != null)
						response[i].info.attachment  = true;

					$scope.datasetList.push(response[i]);
				}
			}
		}

		$scope.totalItems = $scope.datasetList.length;
	});


	$scope.selectPage = function() {
		//$scope.filteredStreamsList = $scope.streamsList.slice(($scope.currentPage - 1) * $scope.pageSize, $scope.currentPage * $scope.pageSize);
	};

	$scope.searchNameFilter = function(dataset) {
		var keyword = new RegExp($scope.nameFilter, 'i');
		return !$scope.nameFilter || (dataset.info.datasetName && keyword.test(dataset.info.datasetName));
	};

	$scope.$watch('nameFilter', function(newName) {
		$scope.currentPage = 1;
		$scope.totalItems = $scope.filteredDatasetsList.length;
	});
	
	$scope.viewUnistalledFilter = function(dataset) {
		if(!$scope.viewUnistalledCheck){
			return dataset.configData.deleted!=1;
		}
		else
			return true;
	};

	$scope.$watch('viewUnistalledCheck', function(newCode) {
		$scope.currentPage = 1;
		$scope.totalItems = $scope.filteredDatasetsList.length;
	});

	$scope.selectedDatasets = [];

	$scope.isSelected = function(dataset) {
		return $scope.selectedDatasets.indexOf(dataset) >= 0;
	};

	$scope.updateSelection = function($event, dataset) {
		var checkbox = $event.target;
		var action = (checkbox.checked ? 'add' : 'remove');
		updateSelected(action, dataset);
	};

	var updateSelected = function(action, dataset) {
		if (action === 'add' && $scope.selectedDatasets.indexOf(dataset) === -1) {
			$scope.selectedDatasets.push(dataset);
		}
		if (action === 'remove' && $scope.selectedDatasets.indexOf(dataset) !== -1) {
			$scope.selectedDatasets.splice($scope.selectedDatasets.indexOf(dataset), 1);
		}
	};

	$scope.canEdit = function() {
		if($scope.selectedDatasets.length==1 && 
				($scope.selectedDatasets[0].configData && $scope.selectedDatasets[0].configData.type == "dataset" && $scope.selectedDatasets[0].configData.subtype == "bulkDataset")){
			return true;
		}
		return false;
	};

	$scope.canDelete = function() {
		
		return false;
	};

	$scope.editDataset = function(){
		if($scope.selectedDatasets.length===1){
			$location.path('management/editDataset/'+$scope.tenantCode +'/'+$scope.selectedDatasets[0].datasetCode);
		} else {
			// FIXME error message...
		}
	};
}]);


appControllers.controller('ManagementDatasetModalCtrl', [ '$scope', '$routeParams', 'fabricAPIservice', 'fabricAPImanagement', '$location', '$modalInstance', 'selectedDataset', 'info', 'readFilePreview',
                                                     function($scope, $routeParams, fabricAPIservice, fabricAPImanagement, $location, $modalInstance, selectedDataset, info, readFilePreview) {
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> $scope', $scope);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> $routeParams', $routeParams);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> fabricAPIservice', fabricAPIservice);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> fabricAPImanagement', fabricAPImanagement);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> $location', $location);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> $modalInstance', $modalInstance);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> selectedDataset', selectedDataset);
	console.log('>>>>>>>> ManagementDatasetModalCtrl >>>>>>>> info', info);
	
	$scope.tenantCode = $routeParams.tenant_code;
	
	$scope.loadDataset = function(){
		console.log(">>>>>>>> ManagementDatasetModalCtrl >>>>>>>> selectedDataset in loadDataset", selectedDataset);
		$scope.selectedDataset = selectedDataset;
		console.log(">>>>>>>> ManagementDatasetModalCtrl >>>>>>>> $scope.selectedDataset in loadDataset", $scope.selectedDataset);
		
		fabricAPImanagement.getDataset($scope.tenantCode, $scope.selectedDataset.datasetCode).success(function(response) {
			try{
				console.debug(">>>>>>>> ManagementDatasetModalCtrl >>>>>>>> loadDataset- response", response);
				$scope.datasetModalView = {};
				$scope.datasetModalView.apiMetadataUrl = response.apiMetadataUrl;
				$scope.datasetModalView.dataset = response.metadata;
				$scope.datasetModalView.stream = response.stream;
				$scope.datasetModalView.VIRTUALENTITY_TYPE_TWITTER_ID = Constants.VIRTUALENTITY_TYPE_TWITTER_ID;
				if(!$scope.datasetModalView.dataset)
					$scope.datasetModalView.dataset = new Object();
				if(!$scope.datasetModalView.dataset.info)
					$scope.datasetModalView.dataset.info = new Object();
				if(!$scope.datasetModalView.dataset.info.tags)
					$scope.datasetModalView.dataset.info.tags = [];
				
				$scope.datasetModalView.dataset.todo = true;
				$scope.datasetModalView.dataset.okdo = false;
				$scope.datasetModalView.dataset.kodo = false;
	
				//$scope.dataset.info.visibility = 'public';
				if(!$scope.datasetModalView.dataset.info.icon || $scope.datasetModalView.dataset.info.icon == null)
					$scope.datasetModalView.dataset.info.icon  = "img/dataset-icon-default.png";
			} catch (e) {
				console.error(">>>>>>>> ManagementDatasetModalCtrl >>>>>>>> getDataset ERROR", e);
			}
		});
	};
	
	$scope.deleteDataset = function(){
		console.log("$scope.selectedDataset in deleteDataset", $scope.selectedDataset);
		
		var promiseForDelete = fabricAPImanagement.deleteDataset($scope.datasetModalView.dataset.configData.tenantCode, $scope.datasetModalView.dataset.idDataset, $scope.datasetModalView.dataset.datasetVersion);
		promiseForDelete.then(function(result) {
			console.log('Got notification 1: ', result);
			
			$scope.datasetModalView.dataset.todo = false;
			$scope.datasetModalView.dataset.okdo = true;
			$scope.datasetModalView.dataset.kodo = false;
			/*if(result.errors && data.errors.length>0){
				$scope.updateError = true;
				$scope.updateErrors = data.errors;
				Helpers.util.scrollTo();
			} else {
				$scope.updateInfo = {status: "Ok"};
				$scope.loadDataset();
			}*/
		}, function(result) {
			console.error('Got notification 2: ', result);
			
			$scope.datasetModalView.dataset.todo = false;
			$scope.datasetModalView.dataset.okdo = false;
			$scope.datasetModalView.dataset.kodo = true;
			/*$scope.updateError = true;
			$scope.updateErrors = angular.fromJson(result.data);
			console.log("result.data ", result.data);
			$scope.loadDataset();*/
		}, function(result) {
			// FIXME error message...
		});
	};

	$scope.loadDataset();
	
	$scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
	};
}]);

appControllers.controller('ManagementDatasetCtrl', [ '$scope', '$routeParams', 'fabricAPIservice', 'fabricAPImanagement', '$location', '$modal', 'info', 'readFilePreview', 'sharedDataset',
                                                     function($scope, $routeParams, fabricAPIservice, fabricAPImanagement, $location, $modal, info, readFilePreview, sharedDataset) {
	$scope.tenantCode = $routeParams.tenant_code;
	$scope.datasetCode = $routeParams.entity_code;
	$scope.downloadCsvUrl = Constants.API_MANAGEMENT_DATASET_DOWNLOAD_URL + $scope.tenantCode + '/' + $scope.datasetCode + '/csv';

	$scope.isOwner = function(){
		return info.isOwner( $scope.tenantCode);
	};

	$scope.OPENDATA_LANGUAGES = Constants.OPENDATA_LANGUAGES;
	$scope.updateInfo = null;
	$scope.updateError = null;

	fabricAPIservice.getTenants().success(function(response) {
		console.debug("response", response.tenants);
		try{
			$scope.tenantsList = [];
			for (var int = 0; int <  response.tenants.tenant.length; int++) {
				var t = response.tenants.tenant[int];
				if(t.tenantCode!=$scope.tenantCode)
					$scope.tenantsList.push(t);
			}
		} catch (e) {
			console.error("getTenants ERROR",e);
		}
	});

	$scope.tagList = [];
	$scope.domainList = [];
	fabricAPIservice.getStreamTags().success(function(response) {
		for (var int = 0; int < response.streamTags.element.length; int++) {
			$scope.tagList.push(response.streamTags.element[int].tagCode);
		}
	});

	$scope.domainList = [];
	fabricAPIservice.getStreamDomains().success(function(response) {
		for (var int = 0; int < response.streamDomains.element.length; int++) {
			$scope.domainList.push(response.streamDomains.element[int].codDomain);
		}
	});

	$scope.dataTypeList = [];
	fabricAPIservice.getStreamDataType().success(function(response) {
		$scope.dataTypeList = response.dataType.element;
	});

	$scope.dataset = null;
	$scope.stream = null;
	$scope.apiMetdataUrl = "";

	$scope.onDateChange = function() {
        if ($scope.dataset.opendata.datetimez) {
        	$scope.dataset.opendata.datetimez = $scope.dataset.opendata.datetimez.getTime();
        }
    };
	
	$scope.loadDataset = function(){
		console.debug("$scope.datasetCode", $scope.datasetCode);
		
		fabricAPImanagement.getDataset($scope.tenantCode, $scope.datasetCode).success(function(response) {
			try{
				console.debug("loadDataset- response",response);
				$scope.apiMetdataUrl = response.apiMetadataUrl;
				$scope.dataset = response.metadata;
				$scope.stream = response.stream;
				$scope.VIRTUALENTITY_TYPE_TWITTER_ID = Constants.VIRTUALENTITY_TYPE_TWITTER_ID;
				if(!$scope.dataset)
					$scope.dataset = new Object();
				if(!$scope.dataset.info)
					$scope.dataset.info = new Object();
				if(!$scope.dataset.info.tags)
					$scope.dataset.info.tags = [];

				if(!$scope.dataset.info.icon || $scope.dataset.info.icon == null)
					$scope.dataset.info.icon  = "img/dataset-icon-default.png";

				if(!$scope.dataset.opendata){
					$scope.dataset.opendata = {};
					$scope.dataset.opendata.isOpendata = 'false';
					$scope.dataset.opendata.language = 'it';
				}
				else if($scope.dataset.opendata.isOpendata){
					$scope.dataset.opendata.isOpendata = 'true';
					if($scope.dataset.opendata.dataUpdateDate && $scope.dataset.opendata.dataUpdateDate!=null){
						var dataUpdateDate = new Date($scope.dataset.opendata.dataUpdateDate);
						$scope.dataset.opendata.dataUpdateDate = Helpers.util.formatDateForInputHtml5(dataUpdateDate);
					}
				}

				//$scope.dataset.info.visibility = 'public';
			} catch (e) {
				console.error("getDataset ERROR", e);
			}
		});

	};

	$scope.loadDataset();

	$scope.newTag = null;
	$scope.addTag = function(){
		if($scope.newTag){
			var found = false;	
			for (var int = 0; int < $scope.dataset.info.tags.length; int++) {
				var existingTag = $scope.dataset.info.tags[int];
				if(existingTag.tagCode == $scope.newTag){
					found = true;
					break;
				}

			}
			if(!found)
				$scope.dataset.info.tags.push({"tagCode":$scope.newTag});
		}
		$scope.newTag = null;
		return false;

	};
	

	$scope.removeTag = function(index){
		$scope.dataset.info.tags.splice(index,1);
		return false;
	};
	
	$scope.addTenantSharing = function(newTenantSharing){
		console.log("addTenantSharing ",newTenantSharing);
		if(newTenantSharing){
			var found = false;	
			if(!$scope.dataset.info.tenantssharing || $scope.dataset.info.tenantssharing == null){
				$scope.dataset.info.tenantssharing = {};
			}
			if(!$scope.dataset.info.tenantssharing.tenantsharing || $scope.dataset.info.tenantssharing.tenantsharing == null){
				$scope.dataset.info.tenantssharing.tenantsharing = [];
			}
			
			for (var int = 0; int < $scope.dataset.info.tenantssharing.tenantsharing.length; int++) {
				var existingTenantSharing = $scope.dataset.info.tenantssharing.tenantsharing[int];
				console.log("existing",existingTenantSharing);
				if(existingTenantSharing.idTenant == newTenantSharing.idTenant){
					console.log("found");
					found = true;
					break;
				}
			}
			if(!found){
				$scope.dataset.info.tenantssharing.tenantsharing.push(
							{"idTenant":newTenantSharing.idTenant, 
								"tenantName": newTenantSharing.tenantName, 
								"tenantDescription": newTenantSharing.tenantDescription, 
								"tenantCode": newTenantSharing.tenantCode, 
								"isOwner": 0
							});
				console.log("added", $scope.dataset.info.tenantssharing.tenantsharing );
			}
		}
		return false;
	};

	$scope.removeTenantSharing = function(index){
		$scope.dataset.info.tenantssharing.tenantsharing.splice(index,1);
		return false;
	};
	
	$scope.selectedIcon;
	$scope.onIconSelect = function($files) {
		$scope.selectedIcon = $files[0];
		if($scope.selectedIcon !=null && $scope.selectedIcon.size>Constants.DATASET_ICON_MAX_FILE_SIZE){
			$scope.choosenIconSize = $scope.selectedIcon.size; 
			$scope.updateWarning = true;
			$scope.selectedIcon = null;
		}
		else
			readIconPreview();
	};
	
	var readIconPreview = function(){
		readFilePreview.readImageFile($scope.selectedIcon).then(
				function(contents){
					console.log("contents" , contents);
					$scope.dataset.info.icon = contents;
				}, 
				function(error){
					$scope.uploadDatasetError = {error_message: error, error_detail: ""};
					Helpers.util.scrollTo();
				}
		);
	};
	
	$scope.canEdit = function() {
		return ($scope.dataset && $scope.dataset.configData && $scope.dataset.configData.type == "dataset" && $scope.dataset.configData.subtype == "bulkDataset");
	};

	$scope.canAddData = function() {
		return ($scope.dataset && $scope.dataset.configData && $scope.dataset.configData.type == "dataset" && $scope.dataset.configData.subtype == "bulkDataset");
	};

	$scope.updateDataset = function() {
		var newDataset =  $scope.dataset;
		$scope.updateInfo = null;
		$scope.updateError = false;
		$scope.openadataDataUpdateDateStyle = "";

		if(!newDataset.info.tags && newDataset.info.tags.length==0){
			newDataset.info.tags = null;
		}

		if(newDataset.opendata.isOpendata !='true'){
			newDataset.opendata = null;
		}
		else{
			if(!newDataset.opendata.language || newDataset.opendata.language == null || newDataset.opendata.language == '')
				newDataset.opendata.language = 'it';
			
			if(newDataset.opendata.dataUpdateDate!=null)
				newDataset.opendata.dataUpdateDate = new Date(newDataset.opendata.dataUpdateDate).getTime();

		}


		
		Helpers.util.scrollTo();
		if(!$scope.updateError){
			console.log("updateDataset newDataset ", newDataset);
			var promise   = fabricAPImanagement.updateDataset($scope.tenantCode, $scope.datasetCode, newDataset);
	
			promise.then(function(result) {
				if(result.errors && data.errors.length>0){
					$scope.updateError = true;
					$scope.updateErrors = data.errors;
					Helpers.util.scrollTo();
				}
				else{
					$scope.updateInfo = {status: "Ok"};
					$scope.loadDataset();
				}
			}, function(result) {
				$scope.updateError = true;
				$scope.updateErrors = angular.fromJson(result.data);
				console.log("result.data ", result.data);
				$scope.loadDataset();
			}, function(result) {
				console.log('Got notification: ' + result);
			});
		}
	};	

	$scope.requestInstallation = function(){
		updateLifecycle(Constants.LIFECYCLE_STREAM_REQ_INST);
	};

	$scope.requestUnistallation = function(){
		updateLifecycle(Constants.LIFECYCLE_STREAM_REQ_UNINST);
	};

	$scope.createNewVersion = function(){
		updateLifecycle(Constants.LIFECYCLE_STREAM_NEW_VERSION);
	};

	var updateLifecycle = function(action) {
		console.log("updateLifecycle stream", $scope.stream);
		console.log("updateLifecycle action", action);
//		$scope.updateInfo = null;
//		$scope.updateError = null;
//		Helpers.util.scrollTo();
//		var promise   = fabricAPIservice.lifecycleStream(action, $scope.stream);
//		promise.then(function(result) {
//		console.log("result updateLifecycle ", result);
//		//$scope.updateInfo = angular.fromJson(result.data);  //FIXME when the api will be ready
//		$scope.updateInfo = {status: result.status};
//		$scope.loadStream();
//		}, function(result) {
//		$scope.updateError = angular.fromJson(result.data);
//		console.log("result.data ", result.data);
//		$scope.loadStream();
//		}, function(result) {
//		console.log('Got notification: ' + result);
//		});
	};
	
	$scope.animationsEnabled = true;

	$scope.openModalView = function(size) {
		var modalInstance = $modal.open({
			animation : $scope.animationsEnabled,
			templateUrl : 'myModalContent.html',
			controller : 'ManagementDatasetModalCtrl',
			size : size,
			resolve : {
				items : function() {
					return $scope.items;
				},
				selectedDataset: function() {
					console.log(">>>>>> $scope.dataset in selectedDataset", $scope.dataset);
					return $scope.dataset;
				}
			}
		});

		modalInstance.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
					console.log("selected in modalInstance.result.then", selectedItem);
				}, function() {
					console.info('Modal dismissed at: ' + new Date());
		});
	};

	$scope.canDelete = function() {
		if ($scope.dataset){
			console.log(">>>>>>>> $scope.dataset", $scope.dataset);
			if ($scope.dataset.configData && $scope.dataset.configData.type == "dataset" &&  
					($scope.dataset.configData.subtype == "bulkDataset" || 
					 $scope.dataset.configData.subtype == "streamDataset" || 
					 $scope.dataset.configData.subtype == "socialDataset")){
				return true;
			}
		}
		return false;
	};
	
	$scope.cloneDataset = function(){
		console.log("cloneDataset");
		sharedDataset.setDataset($scope.dataset);
		$location.path('management/newDataset/'+$scope.tenantCode);
	};

} ]);



appControllers.controller('ManagementUploadDatasetCtrl', [ '$scope', '$routeParams', 'fabricAPImanagement', 'info', '$upload', 'readFilePreview','$translate',  
                                                           function($scope, $routeParams, fabricAPImanagement, info, $upload, readFilePreview, $translate) {
	$scope.tenantCode = $routeParams.tenant_code;
	$scope.datasetCode = $routeParams.entity_code;

	$scope.isOwner = function(){
		return info.isOwner( $scope.tenantCode);
	};
	$scope.maxFileSize = Constants.BULK_DATASET_MAX_FILE_SIZE;
	$scope.choosenFileSize = null;
	$scope.selectedFile = null;
	$scope.updateInfo = null;
	$scope.updateWarning = null;
	$scope.updateError = null;
	$scope.updateErrors = null;
	console.log("uploadData START", $scope.datasetCode);

	$scope.formatList = ["csv"];

	$scope.csvSeparator = ";";
	$scope.fileEncoding = "UTF-8";
	$scope.importFileType = "csv";
	$scope.csvSkipFirstRow = true;

	$scope.dataset = null;

	$scope.loadDataset = function(){
		fabricAPImanagement.getDataset($scope.tenantCode, $scope.datasetCode).success(function(response) {
			console.debug("loadDataset- response",response);
			$scope.dataset = response.metadata;
			if(!$scope.dataset)
				$scope.dataset = new Object();
			if(!$scope.dataset.info)
				$scope.dataset.info = new Object();
			if(!$scope.dataset.info.tags)
				$scope.dataset.info.tags = [];

			$scope.dataset.info.visibility = 'public';
		});

	};

	$scope.loadDataset();

	$scope.onFileSelect = function($files) {
		$scope.selectedFile = $files[0];
		if($scope.selectedFile !=null && $scope.selectedFile.size>Constants.BULK_DATASET_MAX_FILE_SIZE){
			$scope.choosenFileSize = $scope.selectedFile.size; 
			$scope.updateWarning = true;
			$scope.selectedFile = null;
			$scope.previewLines = null;
		}
		else
			readPreview($scope.csvSeparator);
	};

	$scope.previewLines = [];

	var readPreview = function(csvSeparator){
		$scope.updateInfo = null;
		$scope.updateError = null;
		$scope.updateErrors = null;
		$scope.updateWarning = null;
		readFilePreview.readTextFile($scope.selectedFile, 10000, $scope.fileEncoding).then(
				function(contents){



					var lines = contents.split(/\r\n|\n/);
					console.log("nr righe", lines.length);
					var firstRows = lines.slice(0, 5);
					$scope.previewLines = [];
					console.log("(firstRows.join",firstRows.join("\n"));

					console.log("CSVtoArrayAll",Helpers.util.CSVtoArray(firstRows.join("\n"),csvSeparator));

					$scope.previewLines = Helpers.util.CSVtoArray(firstRows.join("\n"),csvSeparator);
				}, 
				function(error){
					$scope.uploadDatasetError = {error_message: error, error_detail: ""};
					Helpers.util.scrollTo();
				}
		);
	};


	$scope.isUploading = false;
	$scope.showUploadButton = true;
	$scope.loadMoreData = function(){
		$scope.showUploadButton = true;
	};


	$scope.uploadData = function() {
		$scope.updateInfo = null;
		$scope.updateError = null;
		$scope.updateErrors = null;
		$scope.updateWarning = null;
		console.log("uploadData START", $scope.csvSeparator);

		$scope.upload = $upload.upload({
			url: Constants.API_MANAGEMENT_DATASET_ADD_DATA_URL + $scope.tenantCode + '/'+ $scope.datasetCode + '/', 

			method: 'POST',
			data: {formatType: $scope.importFileType, 
				csvSeparator: $scope.csvSeparator, encoding: $scope.fileEncoding , skipFirstRow: $scope.csvSkipFirstRow },
				file: $scope.selectedFile, // or list of files ($files) for html5 only
				fileName: $scope.selectedFile.name,

		}).progress(function(evt) {
			$scope.isUploading = true;
			console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
		}).success(function(data, status, headers, config) {
			$scope.isUploading = false;
			$scope.showUploadButton = false;
			console.log("upload finish");
			if(data.errors && data.errors.length>0){
				$scope.updateError = true;
				$scope.updateErrors = data.errors;
				Helpers.util.scrollTo();
				$scope.showUploadButton = true;
			}
			else{
				$scope.selectedFile = null;
				$scope.updateInfo = {status: "Upload OK"};
			}
		});
	};	
}]);


appControllers.controller('ManagementNewDatasetWizardCtrl', [ '$scope', '$route', '$location', 'fabricAPIservice','fabricAPImanagement','readFilePreview','info', '$upload', 'sharedDataset', 
                                                              function($scope, $route, $location, fabricAPIservice, fabricAPImanagement,readFilePreview, info, $upload, sharedDataset) {
	$scope.tenantCode = $route.current.params.tenant_code;
	$scope.currentStep = 'start';
	$scope.wizardSteps = [{'name':'start', 'style':''},
	                      {'name':'requestor', 'style':''},
	                      {'name':'metadata', 'style':''},
	                      {'name':'choosetype', 'style':''},
	                      {'name':'upload', 'style':''},
	                      {'name':'columns', 'style':''},
	                      ];

	$scope.OPENDATA_LANGUAGES = Constants.OPENDATA_LANGUAGES;

	var refreshWizardToolbar = function(){
		var style = 'step-done';
		for (var int = 0; int < $scope.wizardSteps.length; int++) {
			$scope.wizardSteps[int].style = style;
			if($scope.wizardSteps[int].name == $scope.currentStep)
				style = '';
		};
	};
	


	$scope.choosenDatasetType='bulk_upload';

	refreshWizardToolbar();

	$scope.columnDefinitionType = "import";
	$scope.isOwner = function(){
		return info.isOwner( $scope.tenantCode);
	};

	$scope.domainList = [];
	fabricAPIservice.getStreamDomains().success(function(response) {
		for (var int = 0; int < response.streamDomains.element.length; int++) {
			$scope.domainList.push(response.streamDomains.element[int].codDomain);
		}
	});

	$scope.tagList = [];
	$scope.domainList = [];
	fabricAPIservice.getStreamTags().success(function(response) {
		for (var int = 0; int < response.streamTags.element.length; int++) {
			$scope.tagList.push(response.streamTags.element[int].tagCode);
		}
	});
	
	$scope.tenantsList = [];
	fabricAPIservice.getTenants().success(function(response) {
		console.debug("response", response.tenants);
		try{
			
			for (var int = 0; int <  response.tenants.tenant.length; int++) {
				var t = response.tenants.tenant[int];
				if(t.tenantCode!=$scope.tenantCode)
					$scope.tenantsList.push(t);
			}
		} catch (e) {
			console.error("getTenants ERROR",e);
		}
	});


	$scope.unitOfMesaurementList = [];
	fabricAPIservice.getStreamUnitOfMesaurement().success(function(response) {
		$scope.unitOfMesaurementList = response.measureUnit.element;
	});

	var defaultDataType = null;
	$scope.dataTypeList = [];
	fabricAPIservice.getStreamDataType().success(function(response) {
		$scope.dataTypeList = response.dataType.element;
		//$scope.dataTypeList.push(coordinatesDataType);
		for (var int = 0; int < $scope.dataTypeList; int++) {
			if($scope.dataTypeList[int].dataType == 'string'){
				console.log("$scope.dataTypeList[int].dataType", $scope.dataTypeList[int].dataType);
				defaultDataType = $scope.dataTypeList[int].dataType;
				break;
			}
		}
	});
	
	$scope.metadata = sharedDataset.getDataset();
	var isClone = false;
	$scope.previewLines = [];
	$scope.previewColumns = [];
	$scope.previewBinaries = [];

	if($scope.metadata==null){
		$scope.metadata = {info:{}, configData: {}, opendata: {}};
		$scope.metadata.info.icon  = "img/dataset-icon-default.png";
		$scope.metadata.info.visibility = "private";
		$scope.metadata.info.importFileType = "csv";
		$scope.metadata.opendata.language = 'it';
		$scope.metadata.opendata.isOpendata = 'false';
	}
	else{
		isClone = true;
		$scope.metadata.info.datasetName = null;
		$scope.previewColumns = [];
		$scope.previewBinaries = [];
		if($scope.metadata.info.fields.length>0){
			for (var int = 0; int < $scope.metadata.info.fields.length; int++) {
				var field = $scope.metadata.info.fields[int];
				if(field.dataType == 'binary')
					$scope.previewBinaries.push(field);
				else
					$scope.previewColumns.push(field);
			}
		}
		
	}
	$scope.metadata.opendata.dataUpdateDate = Helpers.util.formatDateForInputHtml5(new Date());

	$scope.user = {};

	fabricAPIservice.getInfo().success(function(result) {
		console.debug("result managementnew stream", result);
		$scope.user = result.user;
		console.debug("info user", $scope.user);
		if($scope.user!=undefined && $scope.user.loggedIn==true){
			$scope.metadata.info.requestorName=$scope.user.firstname;
			$scope.metadata.info.requestorSurname=$scope.user.lastname;
			$scope.metadata.info.requestornEmail=$scope.user.email;
		}
	});

	$scope.newTag = null;
	$scope.addTag = function(newTag){
		console.log("addTag", newTag);
		if(newTag){
			if(! $scope.metadata.info.tags)
				$scope.metadata.info.tags = [];

			var found = false;	
			for (var int = 0; int < $scope.metadata.info.tags.length; int++) {
				var existingTag = $scope.metadata.info.tags[int];
				if(existingTag.tagCode == newTag){
					found = true;
					break;
				}

			}
			if(!found)
				$scope.metadata.info.tags.push({"tagCode":newTag});
		}
		return false;

	};

	$scope.removeTag = function(index){
		$scope.metadata.info.tags.splice(index,1);
		return false;
	};
	
	$scope.addTenantSharing = function(newTenantSharing){
		console.log("addTenantSharing ",newTenantSharing);
		if(newTenantSharing){
			var found = false;	
			if(!$scope.metadata.info.tenantssharing || $scope.metadata.info.tenantssharing == null){
				$scope.metadata.info.tenantssharing = {};
			}
			if(!$scope.metadata.info.tenantssharing.tenantsharing || $scope.metadata.info.tenantssharing.tenantsharing == null){
				$scope.metadata.info.tenantssharing.tenantsharing = [];
			}
			
			for (var int = 0; int < $scope.metadata.info.tenantssharing.tenantsharing.length; int++) {
				var existingTenantSharing = $scope.metadata.info.tenantssharing.tenantsharing[int];
				console.log("existing",existingTenantSharing);
				if(existingTenantSharing.idTenant == newTenantSharing.idTenant){
					console.log("found");
					found = true;
					break;
				}

			}
			if(!found){
				$scope.metadata.info.tenantssharing.tenantsharing.push(
							{"idTenant":newTenantSharing.idTenant, 
								"tenantName": newTenantSharing.tenantName, 
								"tenantDescription": newTenantSharing.tenantDescription, 
								"tenantCode": newTenantSharing.tenantCode, 
								"isOwner": 0
							});
				console.log("added", $scope.metadata.info.tenantssharing.tenantsharing );
			}
		}

		return false;
	};

	$scope.removeTenantSharing = function(index){
		$scope.metadata.info.tenantssharing.tenantsharing.splice(index,1);
		return false;
	};

	$scope.creationError = null;
	$scope.saveError = null;
	$scope.saveErrors = null;

	$scope.accettazionePrivacy=0;
	$scope.accettazioneResponsability=0;


	$scope.selectedFile = null;
	$scope.uploadDatasetError = null;
	$scope.uploadDatasetInfo = null;

	$scope.formatList = ["csv"];

	$scope.csvSeparator = ";";
	$scope.fileEncoding = "UTF-8";
	$scope.csvSkipFirstRow = true;

	$scope.choosenFileSize = null;
	$scope.updateWarning = null;
	$scope.maxFileSize = Constants.BULK_DATASET_MAX_FILE_SIZE;
	$scope.choosenFileSize = null;
	
	$scope.selectedIcon;
	$scope.onIconSelect = function($files) {
		$scope.selectedIcon = $files[0];
		if($scope.selectedIcon !=null && $scope.selectedIcon.size>Constants.DATASET_ICON_MAX_FILE_SIZE){
			$scope.choosenIconSize = $scope.selectedIcon.size; 
			$scope.updateWarning = true;
			$scope.selectedIcon = null;
		}
		else
			readIconPreview();
	};

	var readIconPreview = function(){
		readFilePreview.readImageFile($scope.selectedIcon).then(
				function(contents){
					console.log("contents" , contents);
					$scope.metadata.info.icon = contents;
				}, 
				function(error){
					$scope.uploadDatasetError = {error_message: error, error_detail: ""};
					Helpers.util.scrollTo();
				}
		);
	};

	$scope.onFileSelect = function($files) {
		$scope.updateWarning = null;
		$scope.selectedFile = $files[0];
		if($scope.selectedFile !=null && $scope.selectedFile.size>Constants.BULK_DATASET_MAX_FILE_SIZE){
			$scope.choosenFileSize = $scope.selectedFile.size; 
			$scope.updateWarning = true;
			$scope.selectedFile = null;
			$scope.previewLines = null;
		}
		else
			readPreview($scope.csvSeparator);
	};

	
	var readPreview = function(csvSeparator){
		$scope.uploadDatasetError = null;
		readFilePreview.readTextFile($scope.selectedFile, 10000, $scope.fileEncoding).then(
				function(contents){
					var lines = contents.split(/\r\n|\n/);
					console.log("nr righe", lines.length);
					//console.log(lines);
					var firstRows = lines.slice(0, 5);
					$scope.previewLines = [];
					console.log("(firstRows.join",firstRows.join("\n"));
					console.log("CSVtoArrayAll",Helpers.util.CSVtoArray(firstRows.join("\n"),csvSeparator));

					$scope.previewLines = Helpers.util.CSVtoArray(firstRows.join("\n"),csvSeparator);
					console.log("$scope.previewLines",$scope.previewLines);

					$scope.metadata.info.fields = [];
					$scope.previewColumns = [];
					console.log("defaultDataType",defaultDataType);
					if($scope.previewLines.length>0){
						for (var int = 0; int < $scope.previewLines[0].length; int++) {
							$scope.previewColumns.push(
									{index: int, 
										sourceColumn: int+1, 
										fieldName: $scope.previewLines[0][int].replace(/^"(.*)"$/, '$1'), 
										fieldAlias: $scope.previewLines[0][int].replace(/^"(.*)"$/, '$1'), 
										dataType: defaultDataType,
										isKey: false, 
										measureUnit: null,
										skipColumn: false});
						}
						$scope.refreshColumnOrder();
					}
					console.log("$scope.previewColumns",$scope.previewColumns);
				}, 
				function(error){
					$scope.uploadDatasetError = {error_message: error, error_detail: ""};
					Helpers.util.scrollTo();
				}
		);
	};

	$scope.refreshColumnOrder = function(){
		console.log("refreshColumnOrder");
		if($scope.previewColumns && $scope.previewColumns.length>0){
			var order = 0;
			$scope.metadata.info.fields = [];
			for (var int = 0; int < $scope.previewColumns.length; int++) {
				var column  = $scope.previewColumns[int];
				column.index = int;
				if(!column.skipColumn){
					//column.sourceColumn = order;
					var dataType = column.dataType?column.dataType.dataType:'string';
					var measureUnit = column.measureUnit?column.measureUnit.measureUnit:null;
					$scope.metadata.info.fields.push(
							{"sourceColumn":column.sourceColumn, 
								"fieldName":column.fieldName, 
								"fieldAlias":column.fieldAlias, 
								"dataType":dataType, 
								"isKey":column.isKey?1:0, 
								"measureUnit":measureUnit,
								"dateTimeFormat":column.dateTimeFormat,
								"order":order}
					);
					order++;
				}

			}
		}
	};
	
	$scope.newColumnDefinition = {sourceColumn: $scope.previewColumns.length+1};
	$scope.addColumnDefinition = function(){
		console.log("addColumnDefinition",$scope.newColumnDefinition);
		//$scope.newColumnDefinition.sourceColumn = $scope.previewColumns.length+1;
		$scope.insertColumnErrors = [];

		if($scope.newColumnDefinition.fieldName==null || $scope.newColumnDefinition.fieldName=="")
				$scope.insertColumnErrors .push('MANAGEMENT_NEW_DATASET_ERROR_COLUMN_NAME');

		console.log("$scope.newColumnDefinition.sourceColumn",$scope.newColumnDefinition.sourceColumn);
		console.log("$scope.newColumnDefinition.sourceColumn",($scope.newColumnDefinition.sourceColumn==null));
		console.log("$scope.newColumnDefinition.sourceColumn", ($scope.newColumnDefinition.sourceColumn==""));
		if($scope.newColumnDefinition.sourceColumn==null || $scope.newColumnDefinition.sourceColumn=="" || isNaN($scope.newColumnDefinition.sourceColumn))
			$scope.insertColumnErrors .push('MANAGEMENT_NEW_DATASET_ERROR_COLUMN_SOURCE_COLUMN');

		var checkNameDuplicate = false;
		var checkSourceColumnDuplicate = false;
		for (var int = 0; int < $scope.previewColumns.length; int++) {
			if($scope.previewColumns[int].fieldName == $scope.newColumnDefinition.fieldName){
				checkNameDuplicate = true;
			}
			if($scope.previewColumns[int].sourceColumn == $scope.newColumnDefinition.sourceColumn){
				checkSourceColumnDuplicate = true;
			}
		}
		
		if(checkNameDuplicate)
			$scope.insertColumnErrors.push('MANAGEMENT_NEW_DATASET_ERROR_COLUMN_NAME_UNIQUE');
		
		if(checkSourceColumnDuplicate)
			$scope.insertColumnErrors.push('MANAGEMENT_NEW_DATASET_ERROR_COLUMN_SOURCE_COLUMN_UNIQUE');
		
		if($scope.insertColumnErrors.length == 0){
			if(!$scope.newColumnDefinition.fieldAlias || $scope.newColumnDefinition.fieldAlias == null || $scope.newColumnDefinition.fieldAlias == ""){
				$scope.newColumnDefinition.fieldAlias = $scope.newColumnDefinition.fieldName;
			}
			

			$scope.previewColumns.push($scope.newColumnDefinition);
			$scope.newColumnDefinition = {sourceColumn: $scope.previewColumns.length+1};
			$scope.refreshColumnOrder();
		}
	};
	
	$scope.removeColumnDefinition = function(index){
		$scope.previewColumns.splice(index,1);
		$scope.refreshColumnOrder();
	};

	$scope.newBinaryDefinition = {sourceBinary: $scope.previewBinaries.length+1};
	$scope.addBinaryDefinition = function(){
		console.log("addBinaryDefinition",$scope.newBinaryDefinition);
		//$scope.newBinaryDefinition.sourceBinary = $scope.previewBinaries.length+1;
		$scope.insertBinaryErrors = [];

		if($scope.newBinaryDefinition.fieldName==null || $scope.newBinaryDefinition.fieldName=="")
				$scope.insertBinaryErrors .push('MANAGEMENT_NEW_DATASET_ERROR_BINARY_NAME');

		var checkNameDuplicate = false;
		//var checkSourceBinaryDuplicate = false;
		for (var int = 0; int < $scope.previewBinaries.length; int++) {
			if($scope.previewBinaries[int].fieldName == $scope.newBinaryDefinition.fieldName){
				checkNameDuplicate = true;
			}
//			if($scope.previewBinaries[int].sourceBinary == $scope.newBinaryDefinition.sourceBinary){
//				checkSourceBinaryDuplicate = true;
//			}
//
	}
		
		if(checkNameDuplicate)
			$scope.insertBinaryErrors.push('MANAGEMENT_NEW_DATASET_ERROR_BINARY_NAME_UNIQUE');
		
//		if(checkSourceBinaryDuplicate)
//			$scope.insertBinaryErrors.push('MANAGEMENT_NEW_DATASET_ERROR_COLUMN_SOURCE_COLUMN_UNIQUE');
		if($scope.insertBinaryErrors.length == 0){
			if(!$scope.newBinaryDefinition.fieldAlias || $scope.newBinaryDefinition.fieldAlias == null || $scope.newBinaryDefinition.fieldAlias == ""){
				$scope.newBinaryDefinition.fieldAlias = $scope.newBinaryDefinition.fieldName;
			}
			

			$scope.previewBinaries.push($scope.newBinaryDefinition);
			$scope.newBinaryDefinition = {sourceBinary: $scope.previewBinaries.length+1};
			//$scope.refreshColumnOrder();
		}
	};
	
	$scope.removeBinaryDefinition = function(index){
		$scope.previewBinaries.splice(index,1);
		//a$scope.refreshBinaryOrder();
	};

	$scope.onDropCsvFieldComplete=function(fromIndex, toIndex,evt){
		var columToMove = $scope.previewColumns[fromIndex];
		columToMove.dragging = false;
		$scope.previewColumns.splice(fromIndex, 1);
		$scope.previewColumns.splice(toIndex, 0, columToMove);
		$scope.refreshColumnOrder();
	};

	$scope.isDateTimeField = function(field){
		if(field && field.dataType && field.dataType.dataType && field.dataType.dataType == "dateTime")
			return true;
		return false;
	};
	
	$scope.isCoordinatesField = function(field){
		if(field && field.dataType && field.dataType.dataType && field.dataType.dataType == "coordinates")
			return true;
		return false;
	};
	
	$scope.isCommonField = function(field){
		return !$scope.isCoordinatesField(field) && !$scope.isDateTimeField(field);
	};
	
	$scope.cancel = function(){
		$location.path('management/datasets/'+$scope.tenantCode);
	};

	$scope.htmlTooltip = '<div><table class="table table-supercondensed table-dateformat-help">'+
	'	<thead>'+
	'		<tr><th>Letter</th><th>Date or Time</th><th>Presentation</th><th>Examples</th></tr>'+
	'	</thead>'+
	'	<tbody>'+
	'		<tr><td><strong>G</strong></td><td>Era designator</td><td>Text</td><td><strong>AD</strong></td></tr>'+
	'		<tr><td><strong>y</strong></td><td>Year</td><td>Year</td><td><strong>1996</strong>;<strong>96</strong></td></tr>'+
	'		<tr><td><strong>M</strong></td><td>Month in year</td><td>Month</td><td><strong>July</strong>; <strong>Jul</strong>; <strong>07</strong></td></tr>'+
	'		<tr><td><strong>w</strong></td><td>Week in year</td><td>Number</td><td><strong>27</strong></td></tr>'+
	'		<tr><td><strong>W</strong></td><td>Week in month</td><td>Number</td><td><strong>2</strong></td></tr>'+
	'		<tr><td><strong>D</strong></td><td>Day in year</td><td>Number</td><td><strong>189</strong></td></tr>'+
	'		<tr><td><strong>d</strong></td><td>Day in month</td><td>Number</td><td><strong>10</strong></td></tr>'+
	'		<tr><td><strong>F</strong></td><td>Day of week in month</td><td>Number</td><td><strong>2</strong></td></tr>'+
	'		<tr><td><strong>E</strong></td><td>Day in week</td><td>Text</td><td><strong>Tuesday</strong>; <strong>Tue</strong></td></tr>'+
	'		<tr><td><strong>a</strong></td><td>Am/pm marker</td><td>Text</td><td><strong>PM</strong></td></tr>'+
	'		<tr><td><strong>H</strong></td><td>Hour in day (0-23)</td><td>Number</td><td><strong>0</strong></td></tr>'+
	'		<tr><td><strong>k</strong></td><td>Hour in day (1-24)</td><td>Number</td><td><strong>24</strong></td></tr>'+
	'		<tr><td><strong>K</strong></td><td>Hour in am/pm (0-11)</td><td>Number</td><td><strong>0</strong></td></tr>'+
	'		<tr><td><strong>h</strong></td><td>Hour in am/pm (1-12)</td><td>Number</td><td><strong>12</strong></td></tr>'+
	'		<tr><td><strong>m</strong></td><td>Minute in hour</td><td>Number</td><td><strong>30</strong></td></tr>'+
	'		<tr><td><strong>s</strong></td><td>Second in minute</td><td>Number</td><td><strong>55</strong></td></tr>'+
	'		<tr><td><strong>S</strong></td><td>Millisecond</td><td>Number</td><td><strong>978</strong></td></tr>'+
	'		<tr><td><strong>z</strong></td><td>Time zone</td><td>General time zone</td><td><strong><span title="Pacific Standard Time; PST; GMT-08:00">Pacific Standard Time; PST; &hellip;</td></tr>'+
	'		<tr><td><strong>Z</strong></td><td>Time zone</td><td>RFC 822 time zone</td><td><strong>-0800</strong></td>'+
	'	</tbody>'+
	'</table>' + 
	'   </div>'+
	'   <div class="alert">For detail refer to <a href="http://docs.oracle.com/javase/6/docs/api/java/text/SimpleDateFormat.html" target="_blank" class="alert-link">Java Date Format</a></div>' +
	'   <div class="alert alert-info"><strong><i class="glyphicon glyphicon-time"></i></strong>&nbsp;Default timezone <strong>Europe/Rome</strong></div>';
	
	
	$scope.goToStart  = function(){ $scope.currentStep = 'start'; refreshWizardToolbar();};
	$scope.goToRequestor  = function(){ $scope.currentStep = 'requestor';refreshWizardToolbar();};
	$scope.goToMetadata  = function(){ $scope.currentStep = 'metadata';refreshWizardToolbar();};
	$scope.goToChooseType  = function(){
		$scope.selectedFile = null;
		$scope.previewLines = [];
		if(isClone)
			isClone = false;
		else{
			$scope.previewColumns = [];
			$scope.previewBinaries = [];
		}
		$scope.metadata.info.fields = [];
		
		
		$scope.currentStep = 'choosetype';refreshWizardToolbar();
	};
	$scope.goToUpload  = function(){  $scope.currentStep = 'upload';refreshWizardToolbar();};
	$scope.goToColumns  = function(csvSeparator, fileEncoding){
		$scope.columnDefinitionType = "import";  
		readPreview(csvSeparator); 
		console.log("csvSeparator", $scope.csvSeparator, csvSeparator);
		$scope.csvSeparator=csvSeparator;
		$scope.fileEncoding=fileEncoding;
		$scope.currentStep = 'columns';
		refreshWizardToolbar();
	};
	
	$scope.setCsvSkipFirstRow = function(csvSkipFirstRow){
		console.log("setCsvSkipFirstRow",csvSkipFirstRow);
		$scope.csvSkipFirstRow = !csvSkipFirstRow;
	};
	
	$scope.goToCreateColumns  = function(choosen){
		$scope.choosenDatasetType = choosen;
		$scope.columnDefinitionType = "create"; 
		$scope.currentStep = 'columns';
		refreshWizardToolbar();
	};

	 
	var choosenDatasetTypeVar = "";
	
	$scope.chooseDatasetType = function(choosen){
		console.log("choosen",choosen);
		$scope.choosenDatasetType = choosen;

		console.log("$scope.choosenDatasetType",$scope.choosenDatasetType);
		choosenDatasetTypeVar = choosen;
		console.log("$scope.choosenDatasetTypeVar",choosenDatasetTypeVar);

		if(choosen == 'bulk_upload')
			$scope.goToUpload();
		else if(choosen == 'bulk_no_upload'){
			$scope.previewBinaries = [];
			$scope.goToCreateColumns(choosen);
		}
		else{ //if(choosen == 'bulk_no_upload' || choosen == 'binary_no_upload')
			$scope.goToCreateColumns(choosen);
		}
		
	};
	
	$scope.backFromColumns= function(){
		if($scope.choosenDatasetType == 'bulk_upload')
			$scope.goToUpload();
		else{ //if(choosen == 'bulk_no_upload' || choosen == 'binary_no_upload')
			$scope.goToChooseType();
		}
				
	};
	
	$scope.isUploading = false;

	$scope.warningMessages = [];
	
	$scope.createDataset = function() {
		$scope.warningMessages = [];
		$scope.saveError = null;
		$scope.saveErrors = null;
		console.log("createDataset START 1", $scope.metadata);
		$scope.refreshColumnOrder();
		console.log("createDataset START 2", $scope.metadata);
		var newDataset = $scope.metadata;
		newDataset.configData.tenantCode=$scope.tenantCode;
		newDataset.configData.type = "dataset";
		newDataset.configData.subtype = "bulkDataset";
		console.log("dataset qui ", newDataset);
		
		var hasErrors = false;
		
		if(!$scope.metadata.info.fields || $scope.metadata.info.fields==null || $scope.metadata.info.fields.length == 0){
			$scope.warningMessages.push('MANAGEMENT_NEW_DATASET_WARNING_NO_COLUMN');
			$scope.metadata.info.fields = [];
			hasErrors =true;
		}
		console.log("$scope.choosenDatasetType ",$scope.choosenDatasetType );
		console.log("$scope.previewBinaries ",$scope.previewBinaries );
		console.log("$scope.previewBinaries.length ",$scope.previewBinaries.length );
		if($scope.choosenDatasetType == 'binary_no_upload' && $scope.previewBinaries.length==0){
			$scope.warningMessages.push('MANAGEMENT_NEW_DATASET_WARNING_NO_BINARY');
			hasErrors =true;
		}
		
		var startSourceColumn = $scope.metadata.info.fields.length +1;
		for (var i = 0; i < $scope.previewBinaries.length; i++) {
			var fileDef = $scope.previewBinaries[i];
			$scope.metadata.info.fields.push(
					{"sourceColumn":(startSourceColumn + i), 
						"fieldName":fileDef.fieldName, 
						"fieldAlias":fileDef.fieldAlias, 
						"dataType":"binary", 
						"isKey":0, 
						"measureUnit":null,
						"dateTimeFormat":null,
						"order":(startSourceColumn + i -1)}
					);
		}
		
		console.log("dataset dopo binary ", newDataset);
		$scope.openadataDataUpdateDateStyle = "";

		if(typeof newDataset.opendata !== 'undefined' && newDataset.opendata.isOpendata !='true'){
			newDataset.opendata = null;
		}
		else{
			if(!newDataset.opendata.language || newDataset.opendata.language == null || newDataset.opendata.language == '')
				newDataset.opendata.language = 'it';

			if(newDataset.opendata.dataUpdateDate && newDataset.opendata.dataUpdateDate!=null)
				newDataset.opendata.dataUpdateDate = new Date(newDataset.opendata.dataUpdateDate).getTime();

		}

	
		if(!hasErrors){
			var fileName = null;
			if($scope.selectedFile && $scope.selectedFile != null  && $scope.selectedFile.name && $scope.selectedFile.name!=null)
				fileName = $scope.selectedFile.name;
			$scope.upload = $upload.upload({
				url: Constants.API_MANAGEMENT_DATASET_URL + $scope.tenantCode + '/', 
				//headers: { 'Content-Transfer-Encoding': '8bit' },
				method: 'POST',
				data: {dataset: newDataset, formatType: $scope.metadata.info.importFileType, csvSeparator: $scope.csvSeparator, encoding: $scope.fileEncoding, skipFirstRow: $scope.csvSkipFirstRow },
				file: $scope.selectedFile, // or list of files ($files) for html5 only
				fileName: fileName,
	
			}).progress(function(evt) {
				$scope.isUploading = true;
				console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
			}).success(function(data, status, headers, config) {
				$scope.isUploading = false;
				console.log("data loaded");
				if(data.errors && data.errors.length>0){
					$scope.saveError = true;
					$scope.saveErrors = data.errors;
					Helpers.util.scrollTo();
				}
				else{
					$location.path('/management/viewDataset/'+$scope.tenantCode+"/"+data.metadata.datasetCode);
				}
	
			});
		}

	};	
} ]);


