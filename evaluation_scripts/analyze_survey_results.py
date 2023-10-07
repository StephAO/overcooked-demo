import json
import numpy as np
import pandas as pd
from scipy.stats import f_oneway as anova
from scipy.stats import ttest_ind as ttest
from statsmodels.stats.multicomp import pairwise_tukeyhsd

from load_and_filter_results import get_filtered_results

df_survey, df_ranking, df_finished = get_filtered_results('SPs')

# df_survey = df_survey[df_survey.layout_name.isin(['counter_circuit_o_1order'])] #forced_coordination
# df_ranking = df_ranking[df_ranking.layout_name.isin(['counter_circuit_o_1order'])]


agent_names = df_survey.agent_name.unique()
layout_names = df_survey.layout_name.unique()



# ROUND SCORES
print(f"ROUND SCORES".center(50, '='))

# Figure type 1: Compare round scores per agent
score_mean_per_layout = df_survey.groupby(['agent_name', 'layout_name']).mean(['round_score'])
print(f"AVERAGE IN-GAME SCORE PER AGENT PER LAYOUT".center(50, '='))
print(score_mean_per_layout)
score_mean = df_survey.groupby(['agent_name']).mean(['round_score'])
print(score_mean)

# for agent_name in agent_names:
#     improvements = []
#     for layout in layout_names:
#         haha_scores = df_survey[(df_survey['agent_name'] == 'oai_haha_bcp_bcp') & (df_survey['layout_name'] == layout)]['round_score']
#         scores = df_survey[(df_survey['agent_name'] == agent_name) & (df_survey['layout_name'] == layout)]['round_score']
#         print(f'{layout}, {agent_name} vs haha: {np.mean(scores)} <-> {np.mean(haha_scores)} --> {np.mean(haha_scores) / np.mean(scores)}')
#         improvement = float(np.mean(haha_scores) / np.mean(scores)) - 1.
#         improvements.append(improvement)
#
#     print(f'improvement over {agent_name}: {np.mean(improvements)}: {improvements}')

# print(df_survey.groupby(['agent_name', 'layout_name']).std())

# print(f'-----OVERALL-----')
# tukey_results = pairwise_tukeyhsd(endog=df_survey['round_score'],
#                                   groups=df_survey['agent_name'],
#                                   alpha=0.05)
# print(tukey_results)


# layout wise ttestts
# for ln in layout_names:
#     print(f'-----{ln}-----')
#     agent_list_of_scores = []
#     for agent_name in agent_names:
#         scores = df_survey.loc[(df_survey['agent_name'] == agent_name) & (df_survey['layout_name'] == ln)]['round_score'].to_list()
#         agent_list_of_scores.append(scores)
#         # print(f'Variance of scores for {agent_name}: {np.var(scores)}')
#
#     ttest_results = ttest(*agent_list_of_scores)
#     print(ttest_results)
#     print('\n')


# Round scores top and bottom performers
# print("TOP")
# print(df_survey.loc[df_survey.PID.isin(top_PIDS)].groupby(['agent_name', 'layout_name']).mean(['round_score']))
# print("BOTTOM")
# print(df_survey.loc[df_survey.PID.isin(bottom_PIDS)].groupby(['agent_name', 'layout_name']).mean(['round_score']))

print(f"AVERAGE IN-GAME SCORE PER AGENT".center(50, '='))
print(score_mean)
agent_list_of_scores = []
for agent_name in agent_names:
    scores = df_survey.loc[(df_survey['agent_name'] == agent_name)]['round_score'].to_list()
    agent_list_of_scores.append(scores)
    print(f'Variance of scores for {agent_name}: {np.var(scores)}')

print('\n')
ttest_results = ttest(*agent_list_of_scores)
# tukey_results = pairwise_tukeyhsd(endog=df_survey['round_score'],
#                                   groups=df_survey['agent_name'],
#                                   alpha=0.05)

print('*** Over all')
print(ttest_results)
# print('***')
# print(tukey_results)
# print('***')


# RANKING
print(f"RANKING".center(50, '='))
#
# rows_to_drop = []
# print('from>', len(df_ranking))
# for i, row in df_ranking.iterrows():
#     # print(len(df_survey[(df_survey['PID'] == row['PID']) & (df_survey['layout_name'] == row['layout_name'])]))
#     if len(df_survey[(df_survey['PID'] == row['PID']) & (df_survey['layout_name'] == row['layout_name'])]) == 2:
#         rows_to_drop.append((row['PID'], row['layout_name']))
#
# for pid, ln in rows_to_drop:
#     df_ranking = df_ranking[~((df_ranking['PID'] == pid) & (df_ranking['layout_name'] == ln))]
# print('to  >', len(df_ranking))

preferred = []
total = 0
for i, row in df_ranking.iterrows():
    agent_order = json.loads(row['ordered_agents'])
    preferred.append({'agent_name': agent_order[0], 'rank_score': 1., 'layout_name': row['layout_name']})
    preferred.append({'agent_name': agent_order[1], 'rank_score': 0., 'layout_name': row['layout_name']})
    # preferred[agent_order[1]].append(0.)

rank_df = pd.DataFrame.from_dict(preferred)
# print(rank_df)
#
print({k: np.mean(rank_df[rank_df['agent_name'] == k]) for k in rank_df.agent_name.unique()})
agent_preferences = [rank_df[rank_df['agent_name'] == 'oai_haha_fcp_fcp_tuned']['rank_score'], rank_df[rank_df['agent_name'] == 'oai_haha_fcp_fcp']['rank_score']]
#
# print(f'-----Overall-----')
# print(score_mean)
# agent_list_of_scores = []
# for agent_name in agent_names:
#     scores = rank_df.loc[(df_survey['agent_name'] == agent_name)]['rank_score'].to_list()
#     agent_list_of_scores.append(scores)
#     print(f'Variance of scores for {agent_name}: {np.var(scores)}')
#
# print('\n')
# ttest_results = ttest(*agent_list_of_scores)
# exit(0)
#
# for ln in layout_names:
#     print(f'-----{ln}-----')
#     ln_df = rank_df[rank_df['layout_name'] == ln]
#     tukey_results = pairwise_tukeyhsd(endog=ln_df['rank_score'],
#                                       groups=ln_df['agent_name'],
#                                       alpha=0.05)
#     print(tukey_results)

# print(anova_results)

# exit(0)


# LIKERT
# Figure type 2: Compare average likert survey response per agent
print(f"AVERAGE LIKERT SCORES FOR EACH QUESTION".center(50, '='))
print("\nScale from -3 (Strongly Disagree) to 3 (Strongly Agree)\n")
questions = ["The human-agent team worked fluently together:",
             "The human-agent team fluency improved over time:",
             # "I was the most important team member:",
             # "The agent was the most important team member:",
             "I trusted the agent to do the right thing:",
             "The agent helped me adapt to the task:",
             "I understood what the agent was trying to accomplish:",
             "The agent understood what I was trying to accomplish:",
             "The agent was intelligent:",
             "The agent was cooperative:"]


likert_data = {'agent_name': [], 'question': [], 'likert_score': [], 'pid': [], 'layout_name': []}

# Here we actually include level name from the likert scale, this will be useful for plotting

for index, row in df_survey.iterrows():
    likert_scores = [int(num) for num in row['likert_scores'].split(',')]
    for i, ls in enumerate(likert_scores[:8]):
        # if i in [2,3]: # exclude team member question
        #     continue
        likert_data['question'].append(questions[i])
        likert_data['agent_name'].append(row['agent_name'])
        likert_data['layout_name'].append(row['layout_name'])
        likert_data['likert_score'].append(float(ls))
        likert_data['pid'].append(row['PID'])

likert_data = pd.DataFrame(likert_data)

for agent_name in agent_names:
    scores = likert_data.loc[(likert_data['agent_name'] == agent_name)]['likert_score'].to_list()
    print(f'Variance of scores for {agent_name}: {np.var(scores)}')
# Normalize all likert scales so every has a mean of 0
for pid in df_survey.PID.unique():
    mean_likert = np.mean(likert_data.loc[(likert_data['pid'] == pid)]['likert_score'].to_list())
    likert_data.loc[(likert_data['pid'] == pid), 'likert_score'] -= mean_likert
    # max_likert = np.max(np.abs(likert_data.loc[(likert_data['pid'] == pid)]['likert_score'].to_list()))
    # likert_data.loc[(likert_data['pid'] == pid), 'likert_score'] /= max_likert


for agent_name in agent_names:
    scores = likert_data.loc[(likert_data['agent_name'] == agent_name)]['likert_score'].to_list()
    print(f'Variance of scores for {agent_name}: {np.var(scores)}')

for i, q in enumerate(questions):
    print('QUESTION-------------')
    print(q)
    print(f'-----Over All-----')
    df = likert_data[likert_data['question'] == q]

    agent_list_of_scores = []
    for agent_name in agent_names:
        scores = df.loc[(df['agent_name'] == agent_name)]['likert_score'].to_list()
        agent_list_of_scores.append(scores)
        # print(f'Variance of scores for {agent_name}: {np.var(scores)}')
    ttest_results = ttest(*agent_list_of_scores)
    print(ttest_results)

    ### PER LAYOUT
    # for ln in layout_names:
    #     print(f'-----{ln}-----')
    #     ln_df = likert_data[likert_data['layout_name'] == ln]
    #
    #     agent_list_of_scores = []
    #     for agent_name in agent_names:
    #         scores = ln_df.loc[(ln_df['agent_name'] == agent_name)]['likert_score'].to_list()
    #         agent_list_of_scores.append(scores)
    #         # print(f'Variance of scores for {agent_name}: {np.var(scores)}')
    #
    #     ttest_results = ttest(*agent_list_of_scores)
    #     print(ttest_results)


print('FINAL?')
# df = likert_data[likert_data['question'] != questions[2]]
# df = df[likert_data['question'] != questions[3]]

print('---------mean per layout')
print(df.groupby(['agent_name', 'layout_name']).mean(['likert_score']))

print(df.groupby(['agent_name']).mean(['likert_score']))
tukey_results = pairwise_tukeyhsd(endog=df['likert_score'],
                                  groups=df['agent_name'],
                                  alpha=0.05)
print(tukey_results)


# likert_data = {layout_name: {question: {agent_name: [[],[]] for agent_name in agent_names} for question in questions} for layout_name in layout_names}
# # likert_data = {question: {agent_name: [[],[]] for agent_name in agent_names} for question in questions}
#
# medians = df_survey.groupby('layout_name').round_score.median()
# # print(medians)
# median_per_layout = {ln: medians[ln] for ln in layout_names}
# # print(median_per_layout)
# # df_finished = df_finished[df_finished.soups_served > median]
#
# for index, row in df_survey.iterrows():
#     likert_scores = np.array([int(num) for num in row['likert_scores'].split(',')])
#     # likert_scores = likert_scores / (np.max(abs(likert_scores)))
#     for i, ls in enumerate(likert_scores):
#         idx = 0 if row['round_score'] > median_per_layout[row['layout_name']] else 1
#         likert_data[row['layout_name']][questions[i]][row['agent_name']][idx].append(ls)
#         # likert_data[questions[i]][row['agent_name']][idx].append(ls)
#
# for layout_name in layout_names:
#     print(f'---{layout_name}---')
#     for i, (q, agent_likert_data) in enumerate(likert_data[layout_name].items()): # likert_data[layout_name]
#         print_str = f'Q{i}. {q}\n'
#         dist_for_ttest = {'low': [], 'high': []}
#         for agent_name, ls_scores in agent_likert_data.items():
#             if agent_name == 'oai_hrl_tuned':
#                 continue
#             print_str += f'{agent_name}: low {np.mean(ls_scores[1]):5.2f}({np.std(ls_scores[1]):5.2f}) -> high {np.mean(ls_scores[0]):5.2f}({np.std(ls_scores[0]):5.2f}) together {np.mean(ls_scores[0] + ls_scores[1]):5.2f}({np.std(ls_scores[0] + ls_scores[0]):5.2f})  '
#             dist_for_ttest['low'].append(ls_scores[1])
#             dist_for_ttest['high'].append(ls_scores[0])
#
#         print(print_str + '\n')
#         print('low', ttest(*dist_for_ttest['low']))
#         print('high', ttest(*dist_for_ttest['high']))
#
# # Agent Ranking
# # Figure type 3: Compare how each agent was ranked by humans
# print("AVERAGE RANKING".center(50, '='))
# print(f"\nFrom 1 (best) to {len(agent_names)} (worst)\n")
# df_ranking = pd.read_csv('./baselines_study_rankings.csv.csv')
# agent_ranks = {agent_name: [] for agent_name in agent_names}
# for index, row in df_ranking.iterrows():
#     ranking = json.loads(row['ordered_agents'])
#     for i, agent_name in enumerate(ranking):
#         agent_ranks[agent_name].append(i + 1)
#
# for agent_name, ranks in agent_ranks.items():
#     print(f'Average rank of {agent_name}: {np.mean(ranks):5.2f}')
#
#
#
# # EVERYTHING BELOW IS FAKE DATA just to show the structure I will use
# # Change in human behavior
# # Figure type 4: Compare how each agent changed human behavior (using completed subtasks as a proxy for human behavior)
# # Copy and pasted from https://github.com/StephAO/oai_agents/blob/main/oai_agents/common/subtasks.py
# class Subtasks:
#     SUBTASKS = ['get_onion_from_dispenser', 'get_onion_from_counter', 'put_onion_in_pot', 'put_onion_closer',
#                 'get_plate_from_dish_rack', 'get_plate_from_counter', 'put_plate_closer', 'get_soup',
#                 'get_soup_from_counter', 'put_soup_closer', 'serve_soup', 'unknown']
#     HUMAN_READABLE_ST = ['I am grabbing an onion from the dispenser', 'I am grabbing an onion from the counter',
#                          'I am putting my onion in the pot', 'I am placing my onion closer to the pot',
#                          'I am grabbing a dish from the dispenser', 'I am grabbing dish from the counter',
#                          'I am placing my dish closer to the pot', 'I am getting the soup',
#                          'I am grabbing the soup from the counter', 'I am placing the soup closer',
#                          'I am serving the soup', 'unknown']
#     NUM_SUBTASKS = len(SUBTASKS)
#     SUBTASKS_TO_IDS = {s: i for i, s in enumerate(SUBTASKS)}
#     IDS_TO_SUBTASKS = {v: k for k, v in SUBTASKS_TO_IDS.items()}
#     HR_SUBTASKS_TO_IDS = {s: i for i, s in enumerate(HUMAN_READABLE_ST)}
#     IDS_TO_HR_SUBTASKS = {v: k for k, v in HR_SUBTASKS_TO_IDS.items()}
#     BASE_STS = ['get_onion_from_dispenser', 'put_onion_in_pot', 'get_plate_from_dish_rack', 'get_soup', 'serve_soup']
#     SUPP_STS = ['put_onion_closer', 'put_plate_closer', 'put_soup_closer']
#     COMP_STS = ['get_onion_from_counter', 'get_plate_from_counter', 'get_soup_from_counter']

# Overall data structure -> each agent type maps to a list of trajectories
# Each trajectory is a list of tuples where the first number is the timestep of a completed subtask and the second
# number is the index of the subtask completed (see above IDS_TO_SUBTASKS for mapping for index to string)
# In the below sample data, I am using trajectories of 200 timesteps (100 is halfway). The real data will probably be 400 timesteps
# 1. When playing with agent_1, humans have a drastic change in the distribution of subtasks completed at exactly the halfway point.
#    In each case they go from (3x pick up onion from dispenser and place in pot, get plate, serve) to various other
#    subtasks (e.g. getting onions from counters instead, or only focusing on serving)
# 2. When playing with agent_2, humans have a drastic change in number of subtasks completed, but very similar distribution
# 3. When playing with agent_3, humans don't really change
# Ideally, each of these different patterns should be easily noticeable in the figure
# human_completed_subtasks = {'agent_1':
#                             [[(12, 0), (18, 2), (25, 0), (34, 2), (40, 0), (46, 2), (70, 4), (82, 7), (96, 10),
#                              (105, 1), (112, 2), (123, 1), (134, 2), (141, 1), (149, 2), (169, 4), (188, 7), (192, 10)],
#                             [(10, 0), (17, 2), (21, 0), (36, 2), (45, 0), (51, 2), (64, 4), (77, 7), (99, 10),
#                              (101, 0), (116, 3), (129, 0), (139, 3), (149, 0), (155, 3), (167, 0), (188, 3), (192, 0)],
#                             [(6, 0), (16, 2), (27, 0), (41, 2), (49, 0), (58, 2), (81, 4), (87, 7), (94, 10),
#                              (101, 4), (118, 6), (132, 4), (139, 6), (146, 8), (159, 10), (165, 8), (181, 10), (192, 4)]],
#                             'agent_2':
#                             [[(12, 0), (18, 2),
#                               (105, 1), (112, 2), (123, 1), (134, 2), (141, 1), (149, 2), (169, 4), (188, 7), (192, 10)],
#                              [(35, 4), (79, 7), (99, 10),
#                               (101, 0), (116, 3), (129, 0), (139, 3), (149, 0), (155, 3), (167, 0), (188, 3), (192, 0)]],
#                             'agent_3':
#                             [[(12, 0), (18, 2), (25, 0), (34, 2), (40, 0), (46, 2), (70, 4), (82, 7), (96, 10),
#                               (110, 0), (117, 2), (121, 0), (136, 2), (145, 0), (151, 2), (164, 4), (177, 7), (199, 10)],
#                              [(12, 0), (18, 2), (25, 0), (34, 2), (40, 0), (46, 2), (70, 4), (82, 7), (96, 10),
#                               (16, 0), (116, 2), (127, 0), (141, 2), (149, 1), (158, 2), (181, 4), (187, 7), (194, 10)]]
#                             }


