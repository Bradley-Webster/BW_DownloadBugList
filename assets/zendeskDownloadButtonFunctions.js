/* Bradley Webster Download button addition */

//NOOP  (No Operation) function
function  noop() {};

function displayDownload(element, sectionid) {
  // Make the function run only ONCE, via replacing the function with a NOOP (No Operation) function
  displayDownload = noop;
  // Check if Page is private before adding icons
  var pageID = basicinfo.page.id;
  var sectionName = getsectionnamebyid(pageID);
  var isPrivate = sectionName.includes("(");
  if (isPrivate){
    // If the page is private, add the icons to the page
    var content = `<div class="downloadBtn">`;
    content += `<span id="PDFButton" title="Download Bug List PDF" onclick="DownloadButtonPress('PDF')" type="submit"></span><span id="XMLButton" title="Download Bug List XML" onclick="DownloadButtonPress('XML')" type="submit"></span><span id="CSVButton" title="Download Bug List CSV" onclick="DownloadButtonPress('CSV')" type="submit"></span><span id="EXCELButton" title="Download Bug List XLSX" onclick="DownloadButtonPress('XLSX')" type="submit"></span>`;
    content += ' </div>';
    element.before(content);
  	}
  }

// Code ran when download button is pressed
function DownloadButtonPress(format){
  var pageID = basicinfo.page.id;
  var pageResults = basicinfo.allArticles[pageID].results;
  var sectionName = getsectionnamebyid(pageID);
  var isPrivate = sectionName.includes("(");
  
  if (isPrivate){
    JSONExport = []
    for ( results in pageResults){
      var JSONObject = {}

      // add 'TITLE' to JSON object
      JSONObject['TITLE'] = pageResults[results].title;
      
      // get 'updated_at' field and convert to 'dd/mm/yyyy'
      var timestamp = Date.parse(pageResults[results].updated_at);
      var date = new Date(timestamp).toJSON();
      var dateStr = date.slice(0, 10).split("-").reverse().join("/")
      
      var JSONLabelNames = pageResults[results].label_names;
      // Updated ADDED for future column use
      var JSONArrayLabels = ['BugID', 'State','TargetRelease']
      
      // add values within label_names array to JSON object
      for (values in JSONLabelNames){
        JSONValue = JSONLabelNames[values]
        if (JSONValue.includes("icon_colorway")){
          //pass
        }
        else{
          JSONValueSplit = JSONLabelNames[values].split(':');
          if (contains(JSONValueSplit[0], JSONArrayLabels)){  
            // Formatting JSON Key Titles
            if (JSONValueSplit[0] == "BugID"){
              JSONValueSplit[0] = 'BUG_ID'
            }
            if (JSONValueSplit[0] == "State"){
              JSONValueSplit[0] = 'STATUS'
            }
            if (JSONValueSplit[0] == "TargetRelease"){
              JSONValueSplit[0] = 'TARGET_RELEASE'
            }
            JSONObject[JSONValueSplit[0]] = JSONValueSplit[1]
          }
        }
      }
      
      // add 'szUPDATED' to JSON object (Name starts with sz to alphabetically sort into correct position, which is later removed)
      JSONObject['SZ_UPDATED'] = dateStr;
      
      // Sort JSON Object keys alphabetically for Spreadsheet use
      var sortedJSONObject = JSON.stringify(JSONObject, Object.keys(JSONObject).sort())

      // Replace szUPDATED with UPDATED for Spreadsheet use
      sortedJSONObject = sortedJSONObject.replace(/\"SZ_UPDATED\":/g, "\"UPDATED\":"); 

      // Parse back to JSON object after sorting
      sortedJSONObject = JSON.parse(sortedJSONObject);
      
      // Add BUG_TRACKER_URL last so it appears in the rightmost spot of the exported tables
      var longURL = pageResults[results].html_url;
      var longURLSplit = longURL.split("-")
      var shortURL = longURLSplit[0] + '-' + longURLSplit[1];
      sortedJSONObject['BUG_TRACKER_URL'] = shortURL;
      
      JSONExport.push(sortedJSONObject)
    }
    
    // Give the file a name ( FOUNDRY + "private database name" + "Date dd/mm/yyyy" )
    var date = new Date()
    var currentDate = date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear()
    var sectionReplaceWhitespace = sectionName.replace(/ /g,"_")
    var filename = 'FOUNDRY_' + sectionReplaceWhitespace + '_' + currentDate
    
    // Convert the JSON into a downloadable file of user choice
    // Potentially add analytics here for button presses
    if (format == 'CSV'){
    	JSONToCSVConvertor(JSONExport, filename, true);
    }
    if (format == 'PDF'){
    	JSONToPDFConverter(JSONExport, filename)
    }
    if (format == 'XLSX'){
    	JSONToXLSXConverter(JSONExport, filename)
    }
    if (format == 'XML'){
    	JSONToXMLConverter(JSONExport, filename)
    }
  }
  else{
    console.log('Error : Public database, please use private databse')
  }
}

// String array comparison
function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1)
}

/* Bradley Webster Array Buffer Call */
function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

/* Bradley Webster Replace Array Hex XML function */
function removeHexXML(JSONtoXML){
  JSONtoXML = 'bugReports>' + JSONtoXML
  let index = 0
  // Start Bug XML objects at 1 - feedback change
  let bugIndex = 1
  var newValue = ''
  var split = JSONtoXML.split('<');
  var newXML = ''
  for (items in split){
  	if (split[items] == index +'>'){
      newValue = "bug_" + bugIndex + '>'
    }
    else if (split[items] == '/'+ index +'>'){
      newValue = "/bug_" + bugIndex + '>'
      index++
      bugIndex++
    }
    else{
      newValue = split[items]
    }
    newXML += '<'+ newValue 
  }
  return newXML;
}

/* Bradley Webster Download button XML addition */
function JSONToXMLConverter(JSONData, ReportTitle) {
  var fileName = "";
  //this will remove the blank-spaces from the title and replace it with an underscore
  fileName += ReportTitle.replace(/ /g,"_");
  // Convert the JSON list into XML
	var JSONtoXML = json2xml(JSONData)
  // Replace hex XML field with 'report_0'
	JSONtoXML = removeHexXML(JSONtoXML)
  // Reformat the XML for readibiliy
  var format = require('xml-formatter');
  var JSONtoXML = format(JSONtoXML);
  
	// Setup Download button
  window.URL = window.URL || window.webkitURL;

  var xhr = new XMLHttpRequest(),
        a = document.createElement('a'), file;
  file = new Blob([s2ab(JSONtoXML)],{type:"application/octet-stream"});
  a.href = window.URL.createObjectURL(file);
  a.download = fileName + '.xml';
  // Firefox 1.0+
  var isFirefox = typeof InstallTrigger !== 'undefined';

  if (isFirefox){
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    }
  else{
    a.click();
  }
}

/* Bradley Webster Download button PDF addition */
function JSONToPDFConverter(JSONData, ReportTitle){

  var columns = [
      {title: "BUG ID", dataKey: "BUG_ID"},
      {title: "STATUS", dataKey: "STATUS"}, 
      {title: "UPDATED", dataKey: "UPDATED"},     
      {title: "TARGET RELEASE", dataKey: "TARGET_RELEASE"}, 
      {title: "TITLE", dataKey: "TITLE"}, 
      {title: "BUG TRACKER URL", dataKey: "BUG_TRACKER_URL"} ];
  
  var rows = JSONData
  
  // Create the New PDF document
  var doc = new jsPDF('l', 'mm', [297, 210]);
  
  var headerFooterFormatting = function (data) {
    	// Title Formatting
      doc.setFontSize(20);
      doc.setFontStyle('bold');
    	
    	// Top-Left Title 
      var pageID = basicinfo.page.id;
  		var sectionName = getsectionnamebyid(pageID);
      var time = new moment().format("DD/MM/YYYY");
    	var title = 'FOUNDRY. Bug Tracker - ' + sectionName + ' ' + time
      doc.text(title, 7, 10)
    
      // Header Footer formatting
      doc.setFontSize(8);
      doc.setFontStyle('normal');

      // Top-Right Header
      var str = "Page " + data.pageCount;
      doc.text(str, 282, 7);

      // Bottom-Rigt Footer
      var date = new moment().format("DD/MM/YYYY");
      time = new moment().format('h:mm:ss a');
      var today = "Downloaded at " + time + " on " + date
      doc.text(today, 240, 206);
  };
  
  // Per cell formatting ( Adding Color background to Status cells, aligning and bolding columns)
	var perCellFormatting = function(cell, data) { 
        if (data.column.dataKey === "BUG_ID") { 
          cell.styles.fontStyle = 'bold';
          cell.styles.halign = 'center';
        }
        if (data.column.dataKey === "UPDATED") { 
          cell.styles.halign = 'center' ;
        }
        if (data.column.dataKey === "TARGET_RELEASE") { 
          cell.styles.halign = 'center' ;
        } 
        if (data.column.dataKey === "STATUS") { 
          cell.styles.textColor = [255,255,255];
          cell.styles.halign = 'center' ;
        	if (data.row.raw.STATUS === "New"){
          	cell.styles.fillColor = [90,134,198];
          } 
          if (data.row.raw.STATUS === "In Progress"){
          	cell.styles.fillColor = [217,157,50];
          } 
          if (data.row.raw.STATUS === "Pending"){
          	cell.styles.fillColor = [217,157,50];
          } 
          if (data.row.raw.STATUS === "Closed"){
          	cell.styles.fillColor = [167,204,100];
          } 
        }
      }
  
  // Auto Table defaults
  doc.autoTableSetDefaults({
      headerStyles: {fillColor: [39,39,39]}, // Foundry toolbar color
      columnStyles: {id: {fontStyle: 'bold'}},
      headerStyles: {fillColor: 0},
      theme: 'striped',
  });
  // Create the table automatically with the following additions
  doc.autoTable(columns, rows, {
      styles: {fillColor: [232,234,232], fontSize: 8},
      columnStyles: {id: {fillColor: 255},      
      BUG_ID: {columnWidth: 15},
      STATUS: {columnWidth: 20},
      UPDATED: {columnWidth: 22},
      TARGET_RELEASE: {columnWidth: 30},
      TITLE: {columnWidth: 120, overflow: 'linebreak'},
      BUG_TRACKER_URL: {columnWidth: 78, textColor: [26,13,190], fontSize: 6},
			},

    	createdCell: perCellFormatting,
      addPageContent: headerFooterFormatting,
      margin: {
        top: 13,
        bottom: 5,
        left: 7,
      }
  });
  
  var fileName = "";
  //this will remove the blank-spaces from the title and replace it with an underscore
  fileName += ReportTitle.replace(/ /g,"_");
  
  doc.save(fileName + '.pdf');
  
}

/* Bradley Webster Download button XLSX addition */
function JSONToXLSXConverter(JSONData, ReportTitle){
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");
  
    var date = new moment().format("DD-MM-YYYY");
  	ReportTitle = "FOUNDRY_BUG_LIST_" + date
    if(typeof XLSX == 'undefined') XLSX = require('xlsx');
      /* make the worksheet */
  
        var wscols = [
        {wch: 9},
        {wch: 10},
        {wch: 12},
        {wch: 16},
        {wch: 120},
        {wch: 120},
      ];
      var ws = XLSX.utils.json_to_sheet(JSONData);	
  
  		let index = 2
  		for (let JSONObjects in JSONData){
        urlCol = 'F' + index.toString();
        var desired_cell = ws[urlCol];
        var desired_value = desired_cell.v
      	XLSX.utils.cell_set_hyperlink(ws[urlCol], desired_value, "Foundry Support Portal URL");
        index++
      }
  
  
      /* add to workbook */
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, ReportTitle);
  		ws['!cols'] = wscols;
  
      var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});

      window.URL = window.URL || window.webkitURL;

      var xhr = new XMLHttpRequest(),
            a = document.createElement('a'), file;
      file = new Blob([s2ab(wbout)],{type:"application/octet-stream"});
      a.href = window.URL.createObjectURL(file);
      a.download = fileName + '.xlsx';
      // Firefox 1.0+
      var isFirefox = typeof InstallTrigger !== 'undefined';

      if (isFirefox){
        a.target = '_blank';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        }
      else{
        a.click();
    	}
}

/* Bradley Webster Download button CSV addition */
function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
  
    var CSV = '';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";

        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);
        //append Label row with line break
        CSV += row + '\r\n';

    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }
        row.slice(0, row.length - 1);
        //add a line break after each row
        CSV += row + '\r\n';
    }
    if (CSV == '') {
        alert("Invalid data");
        return;
    }
    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");

    //Initialize file format you want csv
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
  
  	window.URL = window.URL || window.webkitURL;
    var xhr = new XMLHttpRequest(),
          a = document.createElement('a'), file;
    a.href = uri;
    a.download = fileName + ".csv";  // Set to whatever file name you want
  
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
  
  	if (isFirefox){
      a.target = '_blank';
  		a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
			}
  	else{
      a.click();
    }
}
