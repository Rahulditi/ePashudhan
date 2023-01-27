var employeeJson = require('./tabledata');

    
function createTableFromJsonData(){
    //Get the headers from JSON data
    var headers = Object.keys(employeeJson.Data[0].keys);
    
    //Prepare html header
    var headerRowHTML='<tr>';
    for(var i=0;i<headers.length;i++){
        headerRowHTML+='<th>'+headers[i]+'</th>';
    }
    headerRowHTML+='</tr>';       
    
    //Prepare all the employee records as HTML
    var allRecordsHTML='';
    for(var i=0;i<employeeJson.length;i++){
     
        //Prepare html row
        allRecordsHTML+='<tr>';
        for(var j=0;j<headers.length;j++){
            var header=headers[j];
            allRecordsHTML+='<td>'+employeeJson[i][header]+'</td>';
        }
        allRecordsHTML+='</tr>';
         
    }
     
    //Append the table header and all records
    var table=document.getElementById("display_json_data");
    table.innerHTML=headerRowHTML + allRecordsHTML;
}

window.onload = createTableFromJsonData();