Survey.StylesManager.applyTheme("defaultV2");

var socket = io();

var json = {
  "pages": [
    {
      "name": "agent_ranking",
      "elements": [
        {
          "type": "ranking",
          "name": "Agent Ranking",
          "title": "Please rank the agents you played in order (first is best) of how much you enjoyed playing with them. Change order by dragging and dropping..",
          "isRequired": true,
          "choices": [],
        }
      ]
    }
  ]
};

ranking_survey = new Survey.Model(json);

ranking_survey.onComplete.add(function (survey) {
    survey.clear(false, true);
    survey.render();
    setup_next_round();

    if (curr_agent_idx == 0) {
        let agent_ranking = survey.data["Agent Ranking"];
        console.log(agent_ranking)
        socket.emit("submit_ranking", agent_ranking);
        ranking_survey.clear(true, true);
        ranking_survey.pages[0].elements[0].choices.length = 0
    }
});
$("#rankingElement").Survey({model: ranking_survey});

