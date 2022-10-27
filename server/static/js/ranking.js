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

    if (curr_agent_idx == 0) {
        let agent_ranking = survey.data["Agent Ranking"];
        console.log(agent_ranking);
        data = {
            "ordered_agents": agent_ranking,
            "PID": PID,
            "SESSION_ID": SESS_ID,
            "STUDY_ID": STUDY_ID,
            "layout_name" : layout_order[curr_layout_idx]
        }
        socket.emit("submit_ranking", data);
        ranking_survey.clear(true, true);
        ranking_survey.pages[0].elements[0].choices.length = 0
    }

    setup_next_round();

    if (curr_layout_idx >= layout_order.length) {
         data = {
            "PID": PID,
            "SESSION_ID": SESS_ID,
            "STUDY_ID": STUDY_ID,
            "soups_served": tot_soups_served,
            "bonus_payment": tot_soups_served * bonus_per_dish
        }
        socket.emit("completed_full_survey", data);

        $('#start-next-round').hide();
        $('#agents-imgs').hide();
        $('#game-title').hide();
        $('#new-layout').hide();
        $('#completed-str').text(`Thank you for completing the survey. You served a total of ${tot_soups_served} soups, earning a bonus of ${tot_soups_served * bonus_per_dish}$. Please click the button to return to Prolific.co`);
        $('#completed').show();
    }
});
$("#rankingElement").Survey({model: ranking_survey});

