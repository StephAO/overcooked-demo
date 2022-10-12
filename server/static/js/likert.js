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
          "isAllRowRequired": true
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

window.survey = new Survey.Model(json);
survey.onComplete.add(function (sender) {
    event.preventDefault();
    console.log(sender.data)
    console.log(agent_layouts[round][0])
    console.log(agent_layouts[round][1])
    console.log(round_score)
    let likert_scores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 10; i++) {
        likert_scores[i] = sender.data["likert"][`q${i + 1}`];
    }
    console.log(likert_scores);
    let data = {
        "agent_name" : agent_layouts[round][0],
        "layout_name" : agent_layouts[round][1],
        "likert_scores" : likert_scores.toString(),
        "round_score" : round_score
    };

    round++;

    if (round >= agent_layouts.length) {
        $('#survey-container').hide();
        $('#next-round').hide();
        $('#agents-imgs').hide();
        $('#end-rounds').show()
    } else {
        $('#survey-container').hide();
        $('#agents-imgs').show();
        $("#teammate-img").attr('src', `\static/assets/${agent_colors[agent_layouts[round][0]]}_chef.png`);
        $('#teammate-desc').text(`This is agent ${agent_colors[agent_layouts[round][0]]}. They will be your teammate for the next round.`);
        $('#next-round').text(`Start Next Round`);
        $('#next-round').show();
    }
    socket.emit("submit_survey", data);
    window.survey.clear(true, true);
});
$("#surveyElement").Survey({model: survey, css: survey_css});

