function pXhr(url, method) { //Promisified XMLHttpRequest
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    if(method === "GET" || method === "PUT" || method === "POST" || method === "DELETE") {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open(method, url);

      req.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
          // Resolve the promise with the response text
          resolve(req.response);
        }
        else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error(req.statusText));
        }
      };

      // Handle network errors
      req.onerror = function() {
        reject(Error("Network Error"));
      };

      // Make the request
      req.send();
    } else {
      reject(Error("Not GET or PUT or POST or DELETE method"));
    }
  });
}

function insert_row(itemName, leftBrother, stdOrAdtn) {
  var row = document.createElement("div");
  row.innerHTML = "<div>" + itemName + "</div><div></div><div></div><div></div><div></div><div></div><div></div>";  
  if(stdOrAdtn === "additional skill") {
    row.className = "row skillitem additional";
  } else {
    row.className = "row skillitem standard";
  }
  leftBrother.after(row);  
}

function add_warning(msg, container) {
  var warning = document.createElement("div");
  warning.innerText = msg;  
  warning.className = "warning";
  container.appendChild(warning); 
}

function addDeleteIcon(container) {
  var delete_icon = document.createElement("div");
  delete_icon.innerHTML = "<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg' ><!-- Created with Method Draw - http://github.com/duopixel/Method-Draw/ --><g><title>background</title><rect fill='#eee' id='canvas_background' height='167' width='140' y='-1' x='-1'/><g display='none' overflow='visible' y='0' x='0' height='100%' width='100%' id='canvasGrid'><rect fill='url(#gridpattern)' stroke-width='0' y='0' x='0' height='100%' width='100%'/></g></g><g><title>Layer 1</title><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_5' y2='32.4375' x2='120.500001' y1='32.4375' x1='21.5' stroke-width='10' fill='none'/><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_6' y2='43.4375' x2='131.5' y1='43.4375' x1='8.500001' stroke-width='12' fill='none'/><line stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_7' y2='149.4375' x2='25.5' y1='46.4375' x1='25.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' stroke='#777' fill='none'/><line stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_8' y2='148.4375' x2='114.5' y1='45.4375' x1='114.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' stroke='#777' fill='none'/><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_9' y2='153.4375' x2='110.500003' y1='153.4375' x1='26.5' stroke-width='10' fill='none'/><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_10' y2='136.4375' x2='45.5' y1='56.437502' x1='45.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' fill='none'/><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_11' y2='136.4375' x2='68.5' y1='56.437502' x1='68.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' fill='none'/><line stroke='#777' stroke-linecap='undefined' stroke-linejoin='undefined' id='svg_12' y2='136.4375' x2='92.5' y1='56.437502' x1='92.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' fill='none'/><ellipse stroke='#777' ry='13.5' rx='27' id='svg_13' cy='22.9375' cx='69.5' fill-opacity='null' stroke-opacity='null' stroke-width='10' fill='none'/></g></svg>";
  delete_icon.className = "delete_icon";
  container.appendChild(delete_icon);
  return delete_icon;
}

function separate_skill_level(skillWithLevel) {
  var skill;
  var level;
  if(skillWithLevel.indexOf("[") >=0) {
    skill = skillWithLevel.substring(0, skillWithLevel.indexOf("["));
    level = skillWithLevel.substring(skillWithLevel.indexOf("[") + 1, skillWithLevel.length - 1);
    return [skill, level];
  }
  return [skillWithLevel, "no suffix"];
}

function getRGBArray(rgb_string) {  // like: rgb(119, 136, 153)
	var red_start = rgb_string.indexOf("(") + 1;
	var red_end = rgb_string.indexOf(",");
	var green_start = red_end + 1;
	var green_end = rgb_string.indexOf(",", green_start + 1);
	var blue_start = green_end + 1;
	var blue_end = rgb_string.indexOf(")");
	var red = rgb_string.substring(red_start, red_end);
	var green = rgb_string.substring(green_start, green_end);
	var blue = rgb_string.substring(blue_start, blue_end);
	return [parseInt(red), parseInt(green), parseInt(blue)];
}

function getAncestorByClassName(descendant, class_name) {
  var current_element = descendant;
  while(current_element) {
    current_element = current_element.parentNode;
    if(current_element && current_element.className === class_name) {
      return current_element;
    }
  }
  return false;
}

function sortChecklist(checklist_object) {
  // only change checklist_object.checkItems
  
  //build array of pos first
  var i, j;
  var pos_array = [];
  for(i=0; i<checklist_object.checkItems.length; i++) {
    pos_array[pos_array.length] = checklist_object.checkItems[i].pos;
  }
  pos_array.sort(function(a, b){return a-b});
  
  //sort checklist_object.checkItems based on pos_array
  // !!! the pos value may be the same for multiple items
  var sorted_items = [];
  for(i=0; i<pos_array.length; i++) {
    for(j=0; j<checklist_object.checkItems.length; j++) {
      if(checklist_object.checkItems[j].pos === pos_array[i]) {
        sorted_items[sorted_items.length] = checklist_object.checkItems[j];
        // deal with issue of same pos value for multiple items
        // pos = -1 will never match pos_array
        checklist_object.checkItems[j].pos = -1 ;
        break;
      }
    }
  }
  checklist_object.checkItems = sorted_items;
  return checklist_object;
}