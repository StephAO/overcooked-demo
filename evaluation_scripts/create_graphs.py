import numpy as np
import pandas as pd
import json
import altair as alt
from scipy.special import comb
from load_and_filter_results import get_filtered_results

exp_name = 'comb'

if 'comb' in exp_name:
    df_survey, df_ranking, df_finished = get_filtered_results('haha_bcp')
    df_survey2, df_ranking2, df_finished2 = get_filtered_results('haha_fcp')
    df_survey = pd.concat([df_survey, df_survey2])
    df_ranking = pd.concat([df_ranking, df_ranking2])
    df_finished = pd.concat([df_finished, df_finished2])
else:
    df_survey, df_ranking, df_finished = get_filtered_results(exp_name)

if 'tuned' in exp_name:
    df_survey = df_survey[df_survey['layout_name'] == 'counter_circuit_o_1order']
    df_ranking = df_ranking[df_ranking['layout_name'] == 'counter_circuit_o_1order']# 'forced_coordination'

agent_names = df_survey.agent_name.unique()
layout_names = df_survey.layout_name.unique()


df_survey.loc[ df_survey["agent_name"] == "oai_haha_bcp_bcp", "agent_name"] = "HAHA_BCP"
df_survey.loc[ df_survey["agent_name"] == "oai_haha_fcp_fcp", "agent_name"] = "HAHA_FCP"
df_survey.loc[ df_survey["agent_name"] == "oai_bcp", "agent_name"] = "BCP"
df_survey.loc[ df_survey["agent_name"] == "oai_fcp", "agent_name"] = "FCP"

df_survey.loc[ df_survey["agent_name"] == "oai_haha_bcp_bcp_tuned", "agent_name"] = "HAHA_BCP_tuned"
df_survey.loc[ df_survey["agent_name"] == "oai_haha_fcp_fcp_tuned", "agent_name"] = "HAHA_FCP_tuned"

df_survey.loc[ df_survey["layout_name"] == "forced_coordination", "layout_name"] = "Forced Coordination"
df_survey.loc[ df_survey["layout_name"] == "counter_circuit_o_1order", "layout_name"] = "Counter Circuit"
df_survey.loc[ df_survey["layout_name"] == "asymmetric_advantages", "layout_name"] = "Asymmetric Advantages"
df_survey.loc[ df_survey["layout_name"] == "coordination_ring", "layout_name"] = "Coordination Ring"
df_survey.loc[ df_survey["layout_name"] == "cramped_room", "layout_name"] = "Cramped Room"

score_mean = df_survey.groupby(['layout_name', 'agent_name']).mean(['round_scores'])
score_std = df_survey.groupby(['layout_name', 'agent_name']).std()
print(f"AVERAGE IN-GAME SCORE PER AGENT".center(50, '='))
# print(score_mean)
# print(score_std)
# print('\n')
# print(df_survey)



df_survey2 = df_survey.copy()
df_survey3 = df_survey.copy()
df_survey3['layout_name'] = 'Average'
df_survey2 = df_survey2.append(df_survey3)
df_survey2.loc[df_survey2['layout_name'] == "Asymmetric Advantages", "layout_name"] = "Asymmetric Advs."

# df_survey2 = df_survey2[df_survey2['layout_name'] == 'Average']
# score_mean = df_survey2.groupby(['layout_name', 'agent_name']).mean(['round_scores'])
# print(score_mean)
# exit(0)

# print(df_survey2)
# print('----')
# print(df_survey3)

# ROUND SCORES
round_score_chart = alt.Chart(df_survey2).mark_bar().encode(
    x=alt.X('agent_name:N', title='Agent Name', sort=['BCP', 'HAHA_BCP', 'FCP', 'HAHA_FCP']),
    y=alt.Y('mean(round_score):Q', title='Mean Round Score', scale=alt.Scale(domain=[0, 250])),
    color=alt.Color('agent_name:N', legend=None),
    # column=alt.Column(spacing=5)
).properties(
    width=175,
    height=300,

)

# generate the error round_score_chart
error_bars = alt.Chart().mark_errorbar(extent='stdev').encode(
    x=alt.X('agent_name:N', sort=['BCP', 'HAHA_BCP', 'FCP', 'HAHA_FCP'], title=None),
    y=alt.Y('round_score:Q', title='Mean Round Score'),
    strokeWidth=alt.value(2),
    # color=alt.Color('species:Q', legend=None),
)
# "Cramped Room", "Asymmetric Advs.", "Coordination Ring", "Counter Circuit",
#                                              "Forced Coordination",
round_score_chart = alt.layer(round_score_chart, error_bars, data=df_survey2).facet(
    column=alt.Column('layout_name:N', sort=["Average"],
                      header=alt.Header(labelFontSize=18, titleFontSize=20), title=None)
# ).properties(
    # title='Average Score Per Agent'
).configure_title(
    fontSize=20,
    anchor='middle',
).configure_axis(
    labelFontSize=15,  # text size
    titleFontSize=18
)

round_score_chart.save(f'avg_only_graphs_{exp_name}_round_score.svg')

# LIKERT
# Likert Surveys
# Figure type 2: Compare average likert survey response per agent
print(f"AVERAGE LIKERT SCORES FOR EACH QUESTION".center(50, '='))
print("\nScale from -3 (Strongly Disagree) to 3 (Strongly Agree)\n")
questions = [
    "The human-agent team worked fluently together:",
     # "The human-agent team fluency improved over time:",
     "I trusted the agent to do the right thing:",
     "The agent helped me adapt to the task:",
     # "I understood what the agent was trying to accomplish:",
     # "The agent understood what I was trying to accomplish:",
     "The agent was intelligent:",
     # "The agent was cooperative:"
]
# "I was the most important team member:",
# "The agent was the most important team member:",

likert_data = {question: {agent_name: [] for agent_name in df_survey.agent_name.unique()} for question in questions}
            #    if (question not in questions[1:4] and question not in questions[7:])}

# Here we actually include level name from the likert scale, this will be useful for plotting
# levels = ['Strong Dis.', 'Dis.', 'Weak Dis.', 'Neutral', 'Weak Agree', 'Agree', 'Strong Agree']
levels = ['SD', 'D', 'WD', 'N', 'WA', 'A', 'SA']
level_map = {int(i -len(levels)//2): levels[i] for i in range(len(levels))}
likert_data_level = {question:
                         {agent_name:
                              {level: 0 for level in levels}
                          for agent_name in df_survey.agent_name.unique()}
                     for question in questions}# if (question not in questions[1:4] and question not in questions[7:])} # exclude important teammates q

for index, row in df_survey.iterrows():
    likert_scores = [int(num) for num in row['likert_scores'].split(',')[:8]]#len(questions)]]
    q_idx = 0
    for i, ls in enumerate(likert_scores):
        # print(i,q_idx)
        if i in [1,4,5,7]: # exclude certain questions to make graph smaller
            continue
        likert_data[questions[q_idx]][row['agent_name']].append(ls)
        likert_data_level[questions[q_idx]][row['agent_name']][level_map[ls]] += 1
        q_idx += 1

# exclude_qs = [1,2,3,7]

#This is just printing
# for i, (q, agent_likert_data) in enumerate(likert_data.items()):
#     print_str = f'Q{i}. {q}\n'
#     for agent_name, ls_scores in agent_likert_data.items():
#         print_str += f'{agent_name}:{np.mean(ls_scores):5.2f} {len(ls_scores)}    '
#     print(print_str + '\n')

# for i, (q, agent_likert_data) in enumerate(likert_data_level.items()):
#     print(f'Q{i}. {q}\n')
#     for agent_name, likert_levels in agent_likert_data.items():
#         print(f'{agent_name}: {likert_levels}')
#     print()
likert_df = []
# Let's convert this to a dataframe we can work with
for question, agent_dict in likert_data_level.items():
    for agent, level_dict in agent_dict.items():
        for level, val in level_dict.items():
            likert_df.append({
                'question': question,
                'agent': agent,
                'level': level,
                'count': val
                })

likert_df = pd.DataFrame(likert_df)
likert_df.head(n=25)


# Compute total and cumulative sum
idx_cols = ['question', 'agent']
grouped = likert_df.groupby(idx_cols)
df_total = grouped.agg(total_count=pd.NamedAgg(column='count', aggfunc='sum')).reset_index()
df_likert_perc = likert_df.merge(df_total, on=idx_cols, how='left')
df_likert_perc['ccount'] = grouped['count'].cumsum()

# Compute percentages
df_likert_perc['perc_start'] = ((df_likert_perc['ccount'] - df_likert_perc['count']) / df_likert_perc['total_count'])*100
df_likert_perc['perc_end'] = (df_likert_perc['ccount'] / df_likert_perc['total_count'])*100

# Now we subtract the middle point of the neutral level
df_neutral = df_likert_perc.query('level=="N"').copy()
df_neutral['neutral_midpoint'] = (df_neutral['perc_end'] + df_neutral['perc_start'])/2

# Ok let's join it back together, and shift everything so that neutral is centered in the graph
df_likert_final = df_likert_perc.merge(df_neutral[idx_cols + ['neutral_midpoint']], on=idx_cols, how='left')
df_likert_final['perc_start_shifted'] = df_likert_final['perc_start'] - df_likert_final['neutral_midpoint']
df_likert_final['perc_end_shifted'] = df_likert_final['perc_end'] - df_likert_final['neutral_midpoint']
df_likert_final.head(n=10)

# level_labels = ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree']
color_scale =alt.Scale(domain=levels, range=["#c30d24", "#C64D5C","#C98C94","#cccccc", "#90ADC1", "#538FB6", "#1770ab"])

likert_chart = alt.Chart(df_likert_final).mark_bar().encode(
    x=alt.X('perc_start_shifted:Q', title='Percent (%)', scale=alt.Scale(domain=[-60, 90], nice=False)),
    x2='perc_end_shifted:Q',
    color=alt.Color('level:N', scale=color_scale, legend=alt.Legend(
        title='Agreement Level',
        titleLimit = 400,
        # values=level_labels,
        labelFontSize=15,
        titleFontSize=15,
        orient='none',
        legendX=0,
        legendY=-70,
        direction='horizontal',
        titleAnchor='middle')),
    y=alt.Y('agent:N', sort= ['BCP', 'HAHA_BCP', 'FCP', 'HAHA_FCP'], title=None),
    row=alt.Row('question', header=alt.Header(labelOrient='top', labelFontSize=15, titleFontSize=15, labelAnchor='start'), spacing=10, sort=questions, title=''),
    order=alt.Order('order:Q', sort='descending'),
).configure_axis(
    titleFontSize=12
).configure_axisY(
    labelFontSize=12
).properties(
    width=420,
)


likert_chart.save(f'graphs/{exp_name}_likert.svg')