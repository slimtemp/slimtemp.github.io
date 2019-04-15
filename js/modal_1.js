/* global TrelloPowerUp */
var t = TrelloPowerUp.iframe();
var sm = {}; // Skill Matrix namespace
sm.popup = undefined;
sm.token = undefined;
sm.card_id = undefined;
sm.checkItems = [];
sm.checklist_id = undefined;
sm.checklistArrayJson = undefined;
sm.templateCardJson = undefined;

// get tocken and authorization
t.get('board', 'private', 'myToken3').then(function (token) {
  if(token == null) {
    sm.popup = window.open("https://trello.com/1/authorize?response_type=token&key=c23aac3a1641cc542b5a75449ad44211&return_url=https%3A%2F%2Fpuzzled-brother.glitch.me/modal.html&callback_method=postMessage&scope=read%2Cwrite%2Caccount&expiration=never&name=SkillPowerUp"); 
  }
  else {
    sm.token = token;
    getAllData();
  }
});

function receiveMessage(event) {  //receive authorization message
  if (event.origin.indexOf("trello")>=0 && event.data.length == 64) {
    t.set('board', 'private', 'myToken3', event.data);
    sm.token = event.data;
    sm.popup.close();
    getAllData(); 
  }
}
window.addEventListener("message", receiveMessage, false);

function getAllData() {
  var pGetChecklists = t.card('id').get('id').then(function (cards) {
    sm.card_id = cards;
    //pXhr Promise is in util.js
    //get Checklist Array in current card
    return pXhr("https://api.trello.com/1/cards/" + sm.card_id + 
          "/checklists?key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "GET")
      .then(function (checklist_array_json) {
        sm.checklistArrayJson = checklist_array_json; });
  });
  
  var pGetTemplateCard = pXhr("https://api.trello.com/1/cards/5b2c58cb7e3e99cd49502d17/checklists?key=c23aac3a1641cc542b5a75449ad44211&token=" 
          + sm.token, "GET")
      .then(function (template_card_json) {
        sm.templateCardJson = template_card_json;
  });
  
  Promise.all([pGetChecklists, pGetTemplateCard]).then(function (){
    //console.log(sm.checklistArrayJson);
    //console.log(sm.templateCardJson);     
    show_table(sm.checklistArrayJson, sm.templateCardJson);
    //get_tools_description
  }).catch(function(e) {
    //alert(e.toString());
    alert("Failed to get data, please contact admin");
  }); 
}

function show_table(checklist_array_json, template_card_json) {
  var checklist_array = JSON.parse(checklist_array_json);
  var template_card = JSON.parse(template_card_json);
  var checklist_skills;
  var template_skills;
  var i, j, k;
  var skills_in_both_card = [];
  var skills_only_in_current = [];
  var skills_only_in_template = [];
  
  for(i=0; i<checklist_array.length; i++) {
    if(checklist_array[i].name === "Skills") {
      checklist_skills = checklist_array[i];
      sm.checkItems = checklist_skills.checkItems;
      sm.checklist_id = checklist_skills.id;
      break;
    }
  }
  
  if(!(checklist_skills)) {
    alert("There is no 'Skills' checklist, please add or copy from another card");
    return -1;
  }
  
  if(!(template_card)) {
    alert("Can't read template card, please contact admin");
    return -1;
  }
  
  for(i=0; i<template_card.length; i++) {
    if(template_card[i].name === "Skills") {
      template_skills = template_card[i];
      break;
    }
  }
  
  // sort check items by position number(pos), make sure the reactivated items appear at the bottom
  checklist_skills = sortChecklist(checklist_skills);
  
  //compare skill list between current card and template card
  for(i=0; i<checklist_skills.checkItems.length; i++) {
    for(j=0; j<template_skills.checkItems.length; j++) {
      if(checklist_skills.checkItems[i].name.indexOf(template_skills.checkItems[j].name)>=0) {
        skills_in_both_card[skills_in_both_card.length] = checklist_skills.checkItems[i].name;
        break;
      }
    }
    //current skill not found in template
    if(j === template_skills.checkItems.length) {
      skills_only_in_current[skills_only_in_current.length] = checklist_skills.checkItems[i].name;
    }
  }
  
  //finally, get skills_only_in_template
  for(i=0; i<template_skills.checkItems.length; i++) {
    for(j=0; j<checklist_skills.checkItems.length; j++) {
      if(checklist_skills.checkItems[j].name.indexOf(template_skills.checkItems[i].name)>=0) {
        break;
      }
    }
    //template skill not found in current
    if(j === checklist_skills.checkItems.length) {
      skills_only_in_template[skills_only_in_template.length] = template_skills.checkItems[i].name;
    }
  }
  
  //console.log(skills_in_both_card);
  //console.log(skills_only_in_current);
  //console.log(skills_only_in_template);
  
  //show standard skill items
  for(i=0; i<template_skills.checkItems.length; i++) {
    //index template_skills.checkItems.length-i-1 is for appending(reversed order to inserting)
    insert_row(template_skills.checkItems[template_skills.checkItems.length-i-1].name, document.getElementsByClassName('row category')[0], "standard skill");
  }
  
  //show additional skill items(skills_only_in_current)
  var skill_name;
  for(i=0; i<skills_only_in_current.length; i++) {
    //delete skill level from name
    //index skills_only_in_current.length-i-1 is for appending(reversed order to inserting)
    //don't show skill with level "Deleted"
    if(separate_skill_level(skills_only_in_current[skills_only_in_current.length-i-1])[1] !== "Deleted") {
      insert_row(separate_skill_level(skills_only_in_current[skills_only_in_current.length-i-1])[0], document.getElementsByClassName('row category')[1], "additional skill");
    }
  }
  
  //freeze category headers
  document.getElementsByClassName('row category')[0].style.top =
    document.getElementsByClassName('header')[0].offsetHeight + "px";
  document.getElementsByClassName('row category')[1].style.top =
    document.getElementsByClassName('header')[0].offsetHeight + "px";
  
  //add items from skills_only_in_template to current checklist  
  var pXhrNewItems=[];
  for(i=0; i<skills_only_in_template.length; i++) {
    //deal with '&' in query url
    skill_name = skills_only_in_template[i].replace("&","%26"); 
    pXhrNewItems[pXhrNewItems.length] = pXhr("https://api.trello.com/1/checklists/" + 
                       checklist_skills.id + "/checkItems?name=" + skill_name + 
                            "[Unassessed]&pos=bottom&checked=false&key=c23aac3a1641cc542b5a75449ad44211&token=" + 
                                    sm.token, "POST");
  }   
  
  Promise.all(pXhrNewItems).then(function () {    
    var pX = Promise.resolve();
    // if skills_only_in_template is not empty, need to re-retrieve checklist_skills, because it's updated
    if(skills_only_in_template.length) {
        pX = pXhr("https://api.trello.com/1/cards/" + sm.card_id + 
            "/checklists?key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "GET")
        .then(function (checklist_array_json) {
            var checklist_array = JSON.parse(checklist_array_json); 
            // if it comes here, Checklist "Skills" must exist
            for(i=0; i<checklist_array.length; i++) {
                if(checklist_array[i].name === "Skills") {
                    checklist_skills = checklist_array[i];
                    sm.checkItems = checklist_skills.checkItems;
                    sm.checklist_id = checklist_skills.id;
                    break;
                }
            }
            // sort check items by position number(pos), make sure the reactivated items appear at the bottom
            checklist_skills = sortChecklist(checklist_skills);
        });
    }
    
    pX.then(function () {
        //show skill levels
        var skills_rows = document.getElementsByClassName("row skillitem");
        var skill;
        var level;
        var pXhrs=[];
        for(i=0; i<skills_rows.length; i++) {
          for(j=0; j<checklist_skills.checkItems.length; j++) {
            skill = separate_skill_level(checklist_skills.checkItems[j].name)[0];
            level = separate_skill_level(checklist_skills.checkItems[j].name)[1];
            if(skill === skills_rows[i].getElementsByTagName("div")[0].innerText) {
              switch(level) {
                case "No skill":
                    skills_rows[i].getElementsByTagName("div")[1].style.backgroundColor = "green";
                    break;
                case "Entry":
                    skills_rows[i].getElementsByTagName("div")[2].style.backgroundColor = "green";
                    break;
                case "Foundation":
                    skills_rows[i].getElementsByTagName("div")[3].style.backgroundColor = "green";
                    break;
                case "Experienced":
                    skills_rows[i].getElementsByTagName("div")[4].style.backgroundColor = "green";
                    break;
                case "Expert":
                    skills_rows[i].getElementsByTagName("div")[5].style.backgroundColor = "green";
                    break;
                case "Thought Leader":
                    skills_rows[i].getElementsByTagName("div")[6].style.backgroundColor = "green";
                    break;
                case "Unassessed":
                    add_warning("NA", skills_rows[i].getElementsByTagName("div")[1]);
                    break;
                case "no suffix":
                    add_warning("NA", skills_rows[i].getElementsByTagName("div")[1]);
                    //add profix "Unassessed"
                    for(k=0; k<sm.checkItems.length; k++) {
                        if(sm.checkItems[k].name === skill) {
                            pXhrs[pXhrs.length] = pXhr("https://api.trello.com/1/cards/" + sm.card_id + "/checkItem/" +
                                sm.checkItems[k].id + "?name=" + skill + "[Unassessed]&state=incomplete" + 
                                    "&key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "PUT");
                            break;
                        }
                    }
                    break;
                default:
              }
              break;
            }
          }
          //add listeners for all functions
          skills_rows[i].childNodes[0].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[1].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[2].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[3].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[4].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[5].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[6].addEventListener('mousemove', show_tip);
          skills_rows[i].childNodes[0].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[1].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[2].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[3].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[4].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[5].addEventListener('mouseout', hide_tip);
          skills_rows[i].childNodes[6].addEventListener('mouseout', hide_tip);
          if(skills_rows[i].className === "row skillitem standard") {
            skills_rows[i].childNodes[0].addEventListener('click', showDescription);
          }
          skills_rows[i].childNodes[1].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[2].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[3].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[4].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[5].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[6].addEventListener('click', change_skill_level);
          skills_rows[i].childNodes[0].style.cursor = "pointer";
          skills_rows[i].childNodes[1].style.cursor = "pointer";
          skills_rows[i].childNodes[2].style.cursor = "pointer";
          skills_rows[i].childNodes[3].style.cursor = "pointer";
          skills_rows[i].childNodes[4].style.cursor = "pointer";
          skills_rows[i].childNodes[5].style.cursor = "pointer";
          skills_rows[i].childNodes[6].style.cursor = "pointer";      
          //remove pointer from warning div child of skills_rows[i].getElementsByTagName("div")[1]
          if(skills_rows[i].getElementsByTagName("div")[1].getElementsByTagName("div")[0]) {
            skills_rows[i].getElementsByTagName("div")[1].getElementsByTagName("div")[0].style.cursor = "auto"; 
          }
        }

        // add delete icon to additional skills
        var descendants;
        var delete_icon_element;
        for(i=0; i<skills_rows.length; i++) {
          if(skills_rows[i].className === "row skillitem additional") {
             delete_icon_element = addDeleteIcon(skills_rows[i].getElementsByTagName("div")[0]);
             descendants = delete_icon_element.querySelectorAll("*");
             for(j=0; j<descendants.length; j++) {
               descendants[j].addEventListener('mousemove', show_tip);
               descendants[j].addEventListener('mouseout', hide_tip);
               descendants[j].addEventListener('click', deleteSkillItem);
             }
          }
        }

        Promise.all(pXhrs).then(function () {
          //add new skill button Eventlistener
          document.getElementsByClassName("button newskill")[0].addEventListener("click", addNewSkill);
          document.getElementsByClassName("input newskill")[0].addEventListener("keydown", enterAddNewSkill);
        }).catch(function(e) {
          alert("Add Unassessed profix error: " + e.toString());
        }); 
    });
  }).catch(function(e) {
    alert("Updating skill list error: " + e.toString());
  });
}

function show_tip(e){
  var not_shown = false;
  if(e.target.style.backgroundColor !== "green" && e.target.style.backgroundColor !== "rgb(222, 184, 135)") e.target.style.backgroundColor = "#C0C0C0" ;
  var popupTip = document.getElementById("popup_tip");  
  popupTip.style.left = e.pageX - popupTip.clientWidth/2 ;
  popupTip.style.top = e.pageY - popupTip.clientHeight - 30;  // let the popup float up
  
  if(e.target.innerHTML === "NA") {   //warning div
      popupTip.innerText = "This item is not assessed" ; 
      popupTip.style.color = "red";
  } else if(typeof e.target.parentNode.className === "string" && e.target.parentNode.className.indexOf("row skillitem") >= 0 ) {
      if(e.target === e.target.parentNode.childNodes[0]) {
        if(e.target.parentNode.className.indexOf("additional") >= 0) {
          //option 1:
          //popupTip.innerText = "No description for additional items" ; 
          //option 2 : don't show anything
          not_shown = true;
        } else {
          popupTip.innerText = "Click to see description" ; 
        }
        popupTip.style.color = "#6A5ACD";
      } else {
        popupTip.innerText = "Click to set skill level" ; 
        popupTip.style.color = "#006400";
      }
  } else if(getAncestorByClassName(e.target, "delete_icon")) {
      getAncestorByClassName(e.target, "delete_icon").parentNode.style.backgroundColor = "#C0C0C0" ;
      popupTip.innerText = "Delete this item" ; 
      popupTip.style.color = "red";
      popupTip.style.left = e.pageX - popupTip.clientWidth/2 + 50;
  }
  
  // green cells don't need tip
  if(e.target.style.backgroundColor !== "green" && !not_shown) {
    popupTip.style.visibility = "visible";
  }
  
  e.stopPropagation();
}

function hide_tip(e){
  if(e.target.style.backgroundColor !== "green" && e.target.style.backgroundColor !== "rgb(222, 184, 135)") e.target.style.backgroundColor = "#f1f1f1" ;
  if(getAncestorByClassName(e.target, "delete_icon")) {
      getAncestorByClassName(e.target, "delete_icon").parentNode.style.backgroundColor = "#f1f1f1" ;
  }
  document.getElementById("popup_tip").style.visibility = "hidden";
  
  e.stopPropagation();
}

function showDescription(e) {
  var skills_rows = document.getElementsByClassName("row skillitem");
  var index;
  var i, j;
  for(i=0; i<skills_rows.length; i++){
    //reset skill item highlight
    skills_rows[i].getElementsByTagName("div")[0].style.backgroundColor = "#f1f1f1";
    //get selected index
    if(skills_rows[i].getElementsByTagName("div")[0] === e.target){
      index = i;
    }
  }
  var popup_desc = document.getElementById("popup_desc");
  var skill_str = skills_rows[index].getElementsByTagName("div")[0].innerText;
  var tools_str;
  var description_str;
  var templateCardArray = JSON.parse(sm.templateCardJson);
  var skill_index_in_template;
  
  for(i=0; i<3; i++) {
    if(templateCardArray[i].name === "Skills") {
      for(j=0; j<templateCardArray[i].checkItems.length; j++) {
        if(templateCardArray[i].checkItems[j].name === skill_str) {
          skill_index_in_template = j;
          break;
        }
      }
    }
  }
  
  for(i=0; i<3; i++) {
    if(templateCardArray[i].name === "Description") {
      description_str = templateCardArray[i].checkItems[skill_index_in_template].name;
    } else if(templateCardArray[i].name === "Tools") {
      tools_str = templateCardArray[i].checkItems[skill_index_in_template].name;
    }
  }
  
  popup_desc.style.top = document.body.scrollTop + document.getElementsByClassName("row")[0].clientHeight  //Header height
                    + document.getElementsByClassName("row")[1].clientHeight; //standard category header
  popup_desc.style.height = document.body.clientHeight - document.getElementsByClassName("row")[0].clientHeight 
                    - document.getElementsByClassName("row")[1].clientHeight - 40;  //40px is for the header of the iframe
  popup_desc.style.left = skills_rows[index].getElementsByTagName("div")[1].offsetLeft; //this.clientWidth + 24; // add padding
  popup_desc.style.width = document.body.clientWidth * 0.95 - skills_rows[index].getElementsByTagName("div")[1].offsetLeft; //The table is only 90% wide of body, 5% on each side, thus 95%
  popup_desc.getElementsByClassName("desc_content")[0].innerText = skill_str;
  popup_desc.getElementsByClassName("desc_content")[1].innerText = tools_str;
  popup_desc.getElementsByClassName("desc_content")[2].innerText = description_str;
  popup_desc.style.visibility = "visible";  
  skills_rows[index].getElementsByTagName("div")[0].style.backgroundColor = "#DEB887";
  
  e.stopPropagation();
}

function change_skill_level(e){
  if(e.target.innerHTML === "NA") return ; //if it's warning div, do nothing
  if(e.target.style.backgroundColor === "green") return ; //no action if target level equals current level
  
  //get skill name
  var skillName = e.target.parentNode.childNodes[0].innerText;
  var targetLevel;
  var i;
  for(i=0; i<e.target.parentNode.childNodes.length; i++) {
    if(e.target === e.target.parentNode.childNodes[i]) {
      switch(i) {
            case 1:
                targetLevel = "No skill";
                break;
            case 2:
                targetLevel = "Entry";
                break;
            case 3:
                targetLevel = "Foundation";
                break;
            case 4:          
                targetLevel = "Experienced";
                break;
            case 5:
                targetLevel = "Expert";
                break;
            case 6:
                targetLevel = "Thought Leader";
                break;
            default:
          }
      break;
    }
  }
  var checkItemId = "";
  for(i=0; i<sm.checkItems.length; i++) {
    if(skillName === separate_skill_level(sm.checkItems[i].name)[0]) {
      checkItemId = sm.checkItems[i].id;
      break;
    }
  }
  
  var pX;
  if(checkItemId !== "") {
    e.target.style.cursor = "progress";
    //deal with "&" in query
    skillName = skillName.replace("&","%26"); 
    pX = pXhr("https://api.trello.com/1/cards/" + sm.card_id + "/checkItem/" +
                            checkItemId + "?name=" + skillName + "[" + targetLevel + "]&state=incomplete" + 
                                "&key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "PUT");
    pX.then(function () {
      e.target.style.cursor = "pointer";
      e.target.style.backgroundColor = "green";
      // reset previous level background color
      for(i=0; i<e.target.parentNode.childNodes.length; i++) {
        if(e.target !== e.target.parentNode.childNodes[i]) {
          e.target.parentNode.childNodes[i].style.backgroundColor = "#f1f1f1";
        }
      }
      //remove warning div
      e.target.parentNode.getElementsByClassName("warning")[0].remove();
  }).catch(function (e) {
      console.log(e);
    });
  }
  
  e.stopPropagation();
}

function close_popup(){
  var i;
  document.getElementById("popup_desc").style.visibility = "hidden";
  //reset skill item highlight
  var skills_rows = document.getElementsByClassName("row skillitem");
  for(i=0; i<skills_rows.length; i++){
    skills_rows[i].getElementsByTagName("div")[0].style.backgroundColor = "#f1f1f1";
  }
}

document.getElementsByClassName("close_button")[0].addEventListener("click", close_popup, false);

function enterAddNewSkill (e) {
  if(e.key === "Enter") {
    addNewSkill();
    document.getElementsByClassName("input newskill")[0].value = "";
  }
  
  e.stopPropagation();
}

function addNewSkill(){
  var new_skill = document.getElementsByClassName("input newskill")[0].value;
  var i;
  var pX;
  var reactivated_or_new;
  if(new_skill == "") {  // == not ===
    alert("Skill name can not be empty");
    return;
  } else {
    for(i=0; i<sm.checkItems.length; i++) {
      if(separate_skill_level(sm.checkItems[i].name)[0] === new_skill) {
        // re-activate deleted skill, and move to bottom, just like adding new item
        if(separate_skill_level(sm.checkItems[i].name)[1] === "Deleted") {
          reactivated_or_new = "reactivated";
          pX = pXhr("https://api.trello.com/1/cards/" + sm.card_id + "/checkItem/" +
                            sm.checkItems[i].id + "?name=" + new_skill + "[Unassessed]&state=incomplete&pos=bottom&key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "PUT");
          sm.checkItems[i].name = new_skill + "[Unassessed]";
        } else {
          alert("This skill is already in the list");
          return;
        }
      }
    }
  }
  // not re-activating deleted skill, but real new skill
  if(reactivated_or_new !== "reactivated") {
    pX = pXhr("https://api.trello.com/1/checklists/" + sm.checklist_id + "/checkItems?name=" + new_skill.replace("&","%26") + "[Unassessed]&pos=bottom&checked=false&key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "POST");
  }
  
  pX.then(function (return_info) {
    if(document.getElementsByClassName("row skillitem additional").length !== 0) {  // It's not the first additional skill
      insert_row(
      new_skill, 
      document.getElementsByClassName("row skillitem additional")[document.getElementsByClassName("row skillitem additional").length-1], 
      "additional skill"
      );
    } else { // It's the first additional skill
      insert_row(new_skill, document.getElementsByClassName("row category")[1], "additional skill");
    }     
      
    var new_row = document.getElementsByClassName("row skillitem additional")[document.getElementsByClassName("row skillitem additional").length-1];
    new_row.childNodes[0].addEventListener('mousemove', show_tip);
    new_row.childNodes[1].addEventListener('mousemove', show_tip);
    new_row.childNodes[2].addEventListener('mousemove', show_tip);
    new_row.childNodes[3].addEventListener('mousemove', show_tip);
    new_row.childNodes[4].addEventListener('mousemove', show_tip);
    new_row.childNodes[5].addEventListener('mousemove', show_tip);
    new_row.childNodes[6].addEventListener('mousemove', show_tip);
    new_row.childNodes[0].addEventListener('mouseout', hide_tip);
    new_row.childNodes[1].addEventListener('mouseout', hide_tip);
    new_row.childNodes[2].addEventListener('mouseout', hide_tip);
    new_row.childNodes[3].addEventListener('mouseout', hide_tip);
    new_row.childNodes[4].addEventListener('mouseout', hide_tip);
    new_row.childNodes[5].addEventListener('mouseout', hide_tip);
    new_row.childNodes[6].addEventListener('mouseout', hide_tip);
    new_row.childNodes[1].addEventListener('click', change_skill_level);
    new_row.childNodes[2].addEventListener('click', change_skill_level);
    new_row.childNodes[3].addEventListener('click', change_skill_level);
    new_row.childNodes[4].addEventListener('click', change_skill_level);
    new_row.childNodes[5].addEventListener('click', change_skill_level);
    new_row.childNodes[6].addEventListener('click', change_skill_level);
    new_row.childNodes[0].style.cursor = "pointer";
    new_row.childNodes[1].style.cursor = "pointer";
    new_row.childNodes[2].style.cursor = "pointer";
    new_row.childNodes[3].style.cursor = "pointer";
    new_row.childNodes[4].style.cursor = "pointer";
    new_row.childNodes[5].style.cursor = "pointer";
    new_row.childNodes[6].style.cursor = "pointer";
    add_warning("NA", new_row.getElementsByTagName("div")[1]);
    //remove pointer from warning div
    if(new_row.getElementsByTagName("div")[1].getElementsByTagName("div")[0]) {
        new_row.getElementsByTagName("div")[1].getElementsByTagName("div")[0].style.cursor = "auto";
    }
    
    // add delete icon and delete event listener
    var descendants ;
    var delete_icon_element ;
    delete_icon_element = addDeleteIcon(new_row.getElementsByTagName("div")[0]);
    descendants = delete_icon_element.querySelectorAll("*");
    for(i=0; i<descendants.length; i++) {
        descendants[i].addEventListener('mousemove', show_tip);
        descendants[i].addEventListener('mouseout', hide_tip);
        descendants[i].addEventListener('click', deleteSkillItem);
    }
    
    // Color animation notifying new row created
    for(i=0; i<new_row.childNodes.length; i++) {
      new_row.childNodes[i].style.backgroundColor = "rgb(255, 0, 0)";
    }
    setTimeout(colorDecrease, 100, new_row);
    
    if(reactivated_or_new !== "reactivated") {
      var return_JSON = JSON.parse(return_info);
      sm.checkItems.length ++ ;
      sm.checkItems[sm.checkItems.length-1] = {};
      sm.checkItems[sm.checkItems.length-1].name = return_JSON.name;
      sm.checkItems[sm.checkItems.length-1].id = return_JSON.id;
    }
  });
}

function colorDecrease(new_row) {
  var i;
  var style = window.getComputedStyle(new_row.childNodes[0]);
  var rgb_array = getRGBArray(style.getPropertyValue('background-color'));
	var green = rgb_array[1]; // green and blue change together
  if(green > 250) {
    for(i=0; i<new_row.childNodes.length; i++) {
      new_row.childNodes[i].style.backgroundColor = "#F1F1F1";
    }
  } else {
    for(i=0; i<new_row.childNodes.length; i++) {
      new_row.childNodes[i].style.backgroundColor = "rgb(255, " + (green+10) + ", " + (green+10) + ")";
    }
    setTimeout(colorDecrease, 100, new_row);
  }
}

function deleteSkillItem(e) {
  var i;
  var delete_icon = getAncestorByClassName(e.target, "delete_icon") ;
  var skill_name = delete_icon.parentNode.innerText;
  var skill_item_row = delete_icon.parentNode.parentNode;
  var deleted_check_item_id;
  var deleted_check_item_name;
  
  // hide delete icon to avoid multiple user clicks
  delete_icon.style.visibility = "hidden" ;
  
  for(i=0; i<sm.checkItems.length; i++) {
    if(separate_skill_level(sm.checkItems[i].name)[0] === skill_name) {
      deleted_check_item_id = sm.checkItems[i].id;
      sm.checkItems[i].id = "[deleted]";
      deleted_check_item_name = sm.checkItems[i].name;
      sm.checkItems[i].name = "[deleted]"; // trick to avoid multiple deletion
      
      var pX = pXhr("https://api.trello.com/1/cards/" + sm.card_id + "/checkItem/" +
                            deleted_check_item_id + "?name=" + skill_name + "[Deleted]&state=incomplete" + 
                                "&key=c23aac3a1641cc542b5a75449ad44211&token=" + sm.token, "PUT");
      pX.then(function () {
        // animation to remove a row
        setTimeout(removeRowAnimation, 50, skill_item_row);
      }).catch(function (e){
        console.log(e.toString());
        // deletion failed, reset sm.checkItems[i]
        sm.checkItems[i].id = deleted_check_item_id;
        sm.checkItems[i].name = deleted_check_item_name;
        // show delete icon
        delete_icon.style.visibility = "visible" ;
      });
      break;
    }
  }
}

function removeRowAnimation(row) {
  row.style.position = "relative";
  row.style.left = parseInt(row.style.left) ? parseInt(row.style.left) + 300 + "px" : "10px";
  if(parseInt(row.style.left) > row.clientWidth) {
    row.remove();
  } else {
    setTimeout(removeRowAnimation, 50, row);
  }
}