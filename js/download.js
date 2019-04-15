/* global TrelloPowerUp */
var t = TrelloPowerUp.iframe() ;
var smDl = {} ; // Skill Matrix download namespace
smDl.popup ;
smDl.token ;
smDl.board = {} ;
smDl.template_card = {} ;
smDl.report_array = [] ;
smDl.complete = false ;
smDl.interval_flag ;

// get tocken and authorization
t.get('board', 'private', 'myToken3').then(function (token) {
  if(token == null) {
    smDl.popup = window.open("https://trello.com/1/authorize?response_type=token&key=c23aac3a1641cc542b5a75449ad44211&return_url=https%3A%2F%2Fpuzzled-brother.glitch.me/modal.html&callback_method=postMessage&scope=read%2Cwrite%2Caccount&expiration=never&name=SkillPowerUp"); 
  }
  else {
    smDl.token = token ;
    getBoardData() ;
  }
});

function receiveMessage(event) {  //receive authorization message
  if (event.origin.indexOf("trello")>=0 && event.data.length == 64) {
    t.set('board', 'private', 'myToken3', event.data) ;
    smDl.token = event.data;
    smDl.popup.close() ;
    getBoardData() ; 
  }
}
window.addEventListener("message", receiveMessage, false) ;

function getBoardData() {
    var pXBoard = (function () {
        return t.board('id').then(function (board) {
            return pXhr("https://api.trello.com/1/boards/" + board.id + "?cards=open&checklists=all&lists=open&key=c23aac3a1641cc542b5a75449ad44211&token=" + smDl.token, "GET")
            .then(function (board_json) {
                smDl.board = JSON.parse(board_json) ;
            }).catch(function (e) {
                console.log(e.toString()) ;
            }) ;
        }) ;
    })() ;
  
    var pXGetTemplateCard = (function () {
        return pXhr("https://api.trello.com/1/cards/5b2c58cb7e3e99cd49502d17/checklists?key=c23aac3a1641cc542b5a75449ad44211&token=" + smDl.token, "GET")
            .then(function (template_card_json) {
                smDl.template_card = JSON.parse(template_card_json) ;
            }).catch(function (e) {
                console.log(e.toString()) ;
            }) ;
    })() ;
  
  Promise.all([pXBoard, pXGetTemplateCard]).then(function () {
      smDl.complete = true ;
  }).catch(function (e) {
      console.log(e.toString()) ;
  }) ;
}

document.getElementById("download").addEventListener("click", function () {
    smDl.interval_flag = setInterval(waitForDataReady, 1000) ;
}) ;

function waitForDataReady() {
    if(smDl.complete === true) {
        clearInterval(smDl.interval_flag) ;
        createReport() ;
    }
}

function createReport() {
    var i, j, k ;
    var cards = smDl.board.cards ;
    var cards_output = [] ;
    // sort card array by list(squad) ID
    cards.sort(function (a, b) {
        if (a.idList < b.idList) {
          return -1 ;
        } else {
          return 1 ;
        }
    }) ;
    
    // create header 1: list(squad) name, header 2: card(member) name
    smDl.report_array[0] = [] ;
    smDl.report_array[1] = [] ;
    smDl.report_array[0][0] = "Squad" ; 
    smDl.report_array[1][0] = "Member" ; 
    var valid_column = 0 ; // exclude the cards in closed list
    for(i=0 ; i<cards.length ; i++) {
        // in case the list is closed(archived), but the cards insides still open
        // only show the cards in open lists
        if(listIdToListName(cards[i].idList)) {
            valid_column++;
            smDl.report_array[0][valid_column] = listIdToListName(cards[i].idList) ;
            smDl.report_array[1][valid_column] = cards[i].name ; 
            cards_output[cards_output.length] = cards[i] ;
        }
    }
    // add an empty divider row and then
    // add a title row for standard skills
    smDl.report_array[2] = [] ;
    smDl.report_array[2][0] = "" ;
    smDl.report_array[3] = [] ;
    smDl.report_array[3][0] = "Standard Skill" ;
  
    // build rows of standard skills
    var standard_skills = [] ;
    for(i=0 ; i<smDl.template_card.length ; i++) {
        if(smDl.template_card[i].name === "Skills") {
            standard_skills = smDl.template_card[i].checkItems ;
            break ;
        }
    }
    for(i=0; i<standard_skills.length ; i++) {
        // create a new row
        smDl.report_array[smDl.report_array.length] = [] ;   // after this, length++
        smDl.report_array[smDl.report_array.length - 1][0] = standard_skills[i].name ;        
    }
    // add an empty divider row and then
    // add a title row for additional skills
    smDl.report_array[smDl.report_array.length] = [] ;   // after this, length++
    smDl.report_array[smDl.report_array.length - 1][0] = "" ;  
    smDl.report_array[smDl.report_array.length] = [] ;   // after this, length++
    smDl.report_array[smDl.report_array.length - 1][0] = "Additional Skill" ;    
    
    // get check items for each card, and for each item(skill) :
    // 1. if the skill is already added by template card(for standar skills) or another card(for additional skills), if so, fill the row, or
    // 2. if the skill has not been added, create a new row, and fill it
    var checklist_ids = [] ;
    var check_items = [] ;
    for(i=0 ; i<cards_output.length ; i++) {
        // reset check_items for new card
        check_items = [] ;
        checklist_ids = cards_output[i].idChecklists ;
      
        break_2_levels_of_loop:
        for(j=0 ; j<checklist_ids.length ; j++) {
            for(k=0 ; k<smDl.board.checklists.length ; k++) {
                if(checklist_ids[j] === smDl.board.checklists[k].id) {
                     check_items = smDl.board.checklists[k].checkItems ;
                     break break_2_levels_of_loop ;
                }
            }
        }
      
        // loop check items
        for(j=0 ; j<check_items.length ; j++) {
            // loop for already listed skill items, start from row 5
            for(k=4 ; k<smDl.report_array.length ; k++) {
                // item already in the report, fill it with level
                if(smDl.report_array[k][0] === separate_skill_level(check_items[j].name)[0]) {
                    smDl.report_array[k][i + 1] = separate_skill_level(check_items[j].name)[1].replace("no suffix", "not assessed") ;
                    break  ;
                }
            }
            // item not found, add a row
            if(k === smDl.report_array.length) {
                smDl.report_array[smDl.report_array.length] = [] ;
                // skill item name
                smDl.report_array[smDl.report_array.length - 1][0] = separate_skill_level(check_items[j].name)[0] ;
                // skill level, be careful, not necessary that it's the first member column
                smDl.report_array[smDl.report_array.length - 1][i + 1] = separate_skill_level(check_items[j].name)[1].replace("no suffix", "not assessed") ;
            }
        }
    }   
    //console.log(smDl.report_array) ;
      
    // create download link and click download
    var csvContent = "data:text/csv;charset=utf-8," ;
    var row ;
    smDl.report_array.forEach(function(rowArray){
        // deal with ',' in skills name, which will corrupt csv file
        // skill name is in the first column
        rowArray[0] = rowArray[0].replace(/\,/g, "&") ;
        row = rowArray.join(",") ;
        csvContent += row + "\r\n" ;
    }); 
    var encodedUri = encodeURI(csvContent) ;
    var link = document.createElement("a") ;
    link.setAttribute("href", encodedUri) ;
    link.setAttribute("download", "skill_matrix.csv") ;
    link.setAttribute("style", "color: blue;") ;
    link.innerText = "If download doesn't start, click here" ;
    document.body.appendChild(link) ;    
    link.click() ;
}

function listIdToListName(list_id) {
    var i ;
    for(i=0 ; i< smDl.board.lists.length ; i++) {
      if(list_id === smDl.board.lists[i].id) {
           return smDl.board.lists[i].name ;
      }
    }
    return undefined ;
}