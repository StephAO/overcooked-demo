Survey.StylesManager.applyTheme("defaultV2");

var socket = io();
var name_to_color = {}
var color_to_name = {}


const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

$(get_action_choices = () => {
    var agent_choices = []
    config = JSON.parse($('#config').text());
    for(i = 0; i < config['agents'].length; i++) {
        name_to_color[config['agents'][i]] = (config['non_human_colors'][i] + ' agent')
        color_to_name[config['non_human_colors'][i] + ' agent'] = config['agents'][i]
        agent_choices.push((config['non_human_colors'][i] + ' agent'))
    }
    shuffleArray(agent_choices);
    return agent_choices
});

console.log(name_to_color)

var json = {
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "ranking",
          "name": "Agent Ranking",
          "title": "Please rank the agents you played by how much you enjoyed playing with them (first is best).",
          "isRequired": true,
          "choices": get_action_choices()
        }
      ]
    }
  ]
};

window.survey = new Survey.Model(json);

survey.onComplete.add(function (sender) {
    event.preventDefault();
    let agent_ranking_by_color = sender.data["Agent Ranking"];
    let agent_ranking_by_real_name = [];
    for (let i = 0; i < agent_ranking_by_color.length; i++) {
        agent_ranking_by_real_name.push(color_to_name[agent_ranking_by_color[i]]);
    }
    console.log(agent_ranking_by_real_name);
    socket.emit("submit_ranking", agent_ranking_by_real_name);
    $("#surveyElement").hide();
    $('#completed').show();
});
$("#surveyElement").Survey({model: survey});

