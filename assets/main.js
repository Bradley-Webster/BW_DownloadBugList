$(function()
{
  let client = ZAFClient.init();
  client.invoke('resize', { width: '100%', height: '400px' });
  client.get('ticket.requester.id').then(
	function(data)
	{
		let user_id = data['ticket.requester.id'];
        console.log('Requester id is ' + JSON.stringify(user_id));
        requestUserInfo(client, user_id);
	}
  );
});
function test(){
    var client = ZAFClient.init();


}
function showInfo(data)
{
  let requester_data =
  {
    'name': data.user.name,
    'tags': data.user.details,
    'created_at': formatDate(data.user.created_at),
    'last_login_at': formatDate(data.user.last_login_at)

  };
  let source = $("#requester-template").html();
  let template = Handlebars.compile(source);
  let html = template(requester_data);
  $("#content").html(html);
}


// get information about ticket, ticket fields or users from Zendesk
function getZendeskInformation(client, fieldName) {
	return new Promise(function (resolve, reject) {
		client.get(fieldName)
			.then(function(data) {
				var value = data[fieldName];
				resolve(value);
			})
			.catch(function() {
				reject("Failed to get requested information");
			});
	});
};

function requestUserInfo(client, id)
{
  let settings =
  {
    url: '/api/v2/users/' + id + '.json',
    type:'GET',
    dataType: 'json',
  };

  client.request(settings).then(
    function(data)
    {
      showInfo(data);
    },
    function(response)
    {
      showError(response);
    }
  );
}

function requestTicketInfo(client, id)
{
  let settings =
  {
    url: '/api/v2/organizations/' + id + 'tickets.json',
    type:'GET',
    dataType: 'json',
  };

  client.request(settings).then(
    function(data)
    {
      showInfo(data);
    },
    function(response)
    {
      showError(response);
    }
  );
}


function buildTable(txt='') {
    var arr = JSON.parse(document.getElementById("JSONTextArea").value);
    var keys = Object.keys(arr[0]);
    txt += "<table border='1' ><tr>"
    for (x in keys) {
        if( keys[x] != 'url'){
            txt += '<td class="bold">' + keys[x]+ '</td>'
        }
    }
    txt += '</tr>'

    for (x in arr) {
        txt += '<tr>'
        for (objects in arr[x]){
            innerObject = arr[x]

            if (innerObject.hasOwnProperty(objects)) {
                var isTitle = false
                var isURL = false

                if (objects == 'Title'){
                    isTitle = true
                }
                else if (objects == 'url'){
                    isURL = true
                }

                if (isTitle == false){
                    if(isURL == false){
                        console.log(isURL)
                        txt += '<td>' + innerObject[objects] + '</td>';
                    }
                }
                else if(isTitle == true){
                    txt += '<td><a href="' + arr[x].url + '">' + arr[x].Title + '</td>';
                }
            }
        }

    txt += '</tr>'

    }
    txt += "</table>"
    document.getElementById("JSONTable").innerHTML = txt;
}

function JSONButtonPress(){
    var JSONArray = JSON.parse(document.getElementById("JSONTextArea").value);
    if(JSONArray == '')
        return;

    JSONToCSVConvertor(JSONArray, "Test Bug Sheet", true);
}


function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    var CSV = 'sep=,' + '\r\n\n';
    //Set Report title in first row or line

    CSV += ReportTitle + '\r\n\n';

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
    var fileName = "MyReport_";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;
    console.log(CSV)
    console.log(link)
    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    var reader = new FileReader();
    reader.onload = function(event) {
         document.getElementById('JSONTextArea').value = event.target.result;
    }
    reader.readAsText(files[0],"UTF-8");
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
