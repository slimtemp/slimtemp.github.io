var GRAY_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-gray.svg';

var boardButtonCallback = function(t){
  /*
  return t.modal({
      url: './modal_2.html',
      // optional color for header chrome
      accentColor: '#F2D600',
      // whether the modal should stretch to take up the whole screen
      fullscreen: true,
      // optional title for header chrome
      title: 'Market Skill Matrix'
    });
    */
  return t.popup({
      title: 'Download skill reports',
      url: './download.html',
      height: 184
    });
};

var cardButtonCallback = function(t){
  return t.card('name').get('name')
  .then(function(cardName){
    t.modal({
      url: './modal_1.html',
      // optional color for header chrome
      accentColor: '#F2D600',
      // whether the modal should stretch to take up the whole screen
      fullscreen: true,
      // optional title for header chrome
      title: 'Skill Details - ' + cardName
    });
  });
};

TrelloPowerUp.initialize({
  'board-buttons': function (t, opts) {
    return [{
      icon: GRAY_ICON,
      text: 'Download skill reports',
      callback: boardButtonCallback
    }];
  },
  'card-buttons': function(t, options) {
    return [{
      icon: GRAY_ICON, // don't use a colored icon here
      text: 'Member skills',
      callback: cardButtonCallback
    }];
  }
}); 

console.log('Loaded by: ' + document.referrer);
