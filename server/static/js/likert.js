// LIKERT SURVEY
Survey.StylesManager.applyTheme("defaultV2");
var json = {
  "logoPosition": "right",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "matrix",
          "name": "likert",
          "title": "Please indicate if you agree or disagree with the following statements",
          "columns": [
            {
              "value": -3,
              "text": "Strongly \n Disagree"
            },
            {
              "value": -2,
              "text": "Disagree"
            },
            {
              "value": -1,
              "text": "Somewhat \n Disagree"
            },
            {
              "value": 0,
              "text": "Neutral"
            },
            {
              "value": 1,
              "text": "Somewhat \n Agree"
            },
            {
              "value": 2,
              "text": "Agree"
            }, {
              "value": 3,
              "text": "Strongly \n Agree"
            }
          ],
          "rows": [
            {
              "value": "q1",
              "text": "The human-agent team worked fluently together:"
            }, {
              "value": "q2",
              "text": "The human-agent team fluency improved over time:"
            }, {
              "value": "q3",
              "text": "I was the most important team member:"
            }, {
              "value": "q4",
              "text": "The agent was the most important team member:"
            }, {
              "value": "q5",
              "text": "I trusted the agent to do the right thing:"
            }, {
              "value": "q6",
              "text": "The agent helped me adapt to the task:"
            }, {
              "value": "q7",
              "text": "I understood what the agent was trying to accomplish:"
            }, {
              "value": "q8",
              "text": "The agent understood what I was trying to accomplish:"
            }, {
              "value": "q9",
              "text": "The agent was intelligent:"
            }, {
              "value": "q10",
              "text": "The agent was cooperative:"
            }
          ],
          "alternateRows": true,
//          "isAllRowRequired": true
        }
      ]
    },
  ],
  "showQuestionNumbers": "off"
};

var survey_css = {
  body: "survey_body",
  question: {
    content: "question_content_custom",
  },
  matrix: {
    mainRoot: "sd-element",
    rootAlternateRows: "sd-table--alternate-rows",
    itemValue: "sd-visuallyhidden sd-item__control sd-radio__control",
    itemChecked: "sd-item--checked sd-radio--checked",
    itemHover: "sd-radio--allowhover",
    row: "sd-table__row",
  },

};

likert_survey = new Survey.Model(json);
likert_survey.onComplete.add(function (sender) {
    let likert_scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 10; i++) {
        likert_scores[i] = sender.data["likert"][`q${i + 1}`];
    }
    let data = {
        "agent_name" : agent_order[curr_agent_idx],
        "layout_name" : layout_order[curr_layout_idx],
        "likert_scores" : likert_scores.toString(),
        "round_score" : round_score,
        "subtask_completion": human_sb_comp,
        "PID": PID,
        "SESSION_ID": SESS_ID,
        "STUDY_ID": STUDY_ID,
    };
    socket.emit("submit_survey", data);
    likert_survey.clear(true, true);
    $('#surveyElement').hide();
    agent_color_name = 'agent ' + name_to_color[agent_order[curr_agent_idx]];
    var new_agent = new Survey.ItemValue(agent_order[curr_agent_idx], agent_color_name);
    console.log(new_agent);
    ranking_survey.pages[0].elements[0].choices.push(new_agent);
    // Setup agent ordering
    el_id = `#agent-${curr_agent_idx+1}`;
    $(el_id+"-img").attr('src', `\static/assets/${name_to_color[agent_order[curr_agent_idx]]}_chef.png`);
    $(el_id+"-dsc").text(`${curr_agent_idx+1}. agent ${name_to_color[agent_order[curr_agent_idx]]}`);
    $(el_id).show();
    // Rank only if there's enough agents to do so
    if (ranking_survey.pages[0].elements[0].choices.length < 2) {
        setup_next_round();
    } else {
        $('#rankingElement').show();
        $('#agents-ordering').show();
    }
});
$("#surveyElement").Survey({model: likert_survey, css: survey_css});

