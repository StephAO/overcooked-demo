Survey.StylesManager.applyTheme("defaultV2");

var non_human_colors = config['non_human_colors']
var choices = []

var json = {
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "ranking",
          "name": "Agent ranking",
          "title": "Please rank the agents you played by how much you enjoyed playing with them (first is best).",
          "isRequired": true,
          "choices": [
            "Battery life",
            "Screen size",
            "Storage space",
            "Camera quality",
            "Durability",
            "Processor power",
            "Price"
          ]
        }
      ]
    }
  ]
};
window.survey = new Survey.Model(json);
survey.onComplete.add(function (sender) {
  document.querySelector('#surveyResult').textContent = "Result JSON:\n" + JSON.stringify(sender.data, null, 3);
});
$("#surveyElement").Survey({model: survey});