function GET_VDSINA_DATA() { // start of the function GET_VDSINA_DATA

  // documentation 
  // https://vdsina.com/tech/api
  // https://vdsina.ru/tech/api

  const VDSinaSS = SpreadsheetApp.getActive().getSheetByName('YOUR_SHEET_NAME_HERE') // Use Sheet With Name
  VDSinaSS.getRange('A2:G').clearContent() // Clear cells from old data
  let row = 2
  let Data = [
    {token:'YOUR_VDSINA_TOKEN_HERE', url:'https://userapi.vdsina.com/v1/server/'},
    {token:'YOUR_VDSINA_TOKEN_HERE', url:'https://userapi.vdsina.ru/v1/server/'},
  ] // put your tokens and urls for your vdsina .com OR .ru accounts here

  for (let q = 0; q < Data.length; q++) { 
 
    head = {
      'Authorization': "Bearer " + Data[q].token,
      'Content-Type': 'application/json'
    }

    params = {
      headers: head,
      method : "get",
      muteHttpExceptions: true
    }

    let Get_Servers_Response = UrlFetchApp.fetch(Data[q].url, params)
    // Logger.log('Server response: ' + Get_Servers_Response.getContentText()) // for investigations
    // console.log("Get_Servers_Response:",Get_Servers_Response.getContentText()) // for investigations

    let servers = JSON.parse(Get_Servers_Response.getContentText())

    // Check server if received data
    if (servers && servers.data && servers.data.length > 0) {
      // Record data to the table from every server
      servers.data.forEach(function(server) {
        VDSinaSS.getRange(q+row,1).setValue(server.id)
        VDSinaSS.getRange(q+row,2).setValue(server.name)
        VDSinaSS.getRange(q+row,3).setValue(server['server-plan'].name)
        VDSinaSS.getRange(q+row,4).setValue(server.datacenter.country)

        // Get traffic data for current server
        let Get_Traffic_Response = UrlFetchApp.fetch(Data[q].url + server.id, params)
        // console.log("Get_Traffic_Response:",Get_Traffic_Response.getContentText()) // for investigations
        let trafficData = JSON.parse(Get_Traffic_Response.getContentText())
        if (trafficData && trafficData.data) {
          let planTraffic = trafficData.data.data.traff.bytes/1024/1024/1024 // write data in GB
          let totalTraffic = trafficData.data.bandwidth.current_month/1024/1024/1024 // write data in GB
          VDSinaSS.getRange(q+row,5).setValue(planTraffic)
          VDSinaSS.getRange(q+row,6).setValue(totalTraffic)
          trafficLeft = totalTraffic/planTraffic*100
          VDSinaSS.getRange(q+row,7).setValue(trafficLeft)
          VDSinaSS.getRange(q+row,8).insertCheckboxes()
        } else {
          Logger.log(`No traffic data found for server ${server.id}`)
          VDSinaSS.getRange(q+row,5).setValue('No data')
          VDSinaSS.getRange(q+row,6).setValue('No data')
          VDSinaSS.getRange(q+row,7).setValue('No data')
          VDSinaSS.getRange(q+row,8).setValue('No data')
        }
      })
    } else {
      Logger.log("No servers data found or an error occurred.")
    }

    // TG Notification
    const TG_Bot_Token = 'YOUR_TG_BOT_API_KEY_HERE' // TG Bot Token
    const tg_user_id = 'YOUR_TG_RECEIVER_ID_HERE' // TG receiver ID

    let Server_ID = VDSinaSS.getRange(q+row,1).getValue()
    let Server_Name = VDSinaSS.getRange(q+row,2).getValue()
    let TG_Alarm = VDSinaSS.getRange(q+row,8).getValue()
    let Alarm_Traffic = VDSinaSS.getRange(q+row,9).getValue()
    let Used_Traffic = VDSinaSS.getRange(q+row,6).getValue()
    let Overage_Size = (Used_Traffic - Alarm_Traffic).toFixed(2)
      if (TG_Alarm === true && Alarm_Traffic !== '' && Used_Traffic > Alarm_Traffic) {
      let data = {
        method: "sendMessage",
        chat_id: tg_user_id,
        text: "<b>" + "Check Server:" + "</b>" + "\nID " + Server_ID + "\nName " + Server_Name + "\n\n<b>Traffic Alarm:</b>" + "\n" + "Overage by " + "<b>" + Overage_Size + " GB" + "</b>",
        parse_mode: "HTML"
      }
      let options = {method: "post",payload: data};
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TG_Bot_Token + '/', options)
    }


  }
  Logger.log("Data fetching and writing complete.")

} // end of the function GET_VDSINA_DATA


