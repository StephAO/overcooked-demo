import json
import numpy as np
import pandas as pd


def get_filtered_results(exp_name='haha_tuned'):
    # df_finished = pd.read_csv(f'./AAMAS24/finished_{exp_name}.csv')
    # df_survey = pd.read_csv(f'./AAMAS24/survey_{exp_name}.csv')
    df_ranking = pd.read_csv(f'./AAMAS24/ranking_{exp_name}.csv')

    df_finished = pd.read_csv(f'./AAMAS/baselines_finished+25.csv')
    df_survey = pd.read_csv(f'./AAMAS/baselines_study_survey+25.csv')


    # Filter STUDY ID
    if 'bcp' in exp_name:
        df_finished = df_finished[df_finished.STUDY_ID == '651722a320c0017a8db28725']
        df_survey = df_survey[df_survey.STUDY_ID == '651722a320c0017a8db28725']
        df_ranking = df_ranking[df_ranking.STUDY_ID == '651722a320c0017a8db28725']

    # Filter Bad PID (too poor rounds, messaged me saying it was laggy, didn't finish, didnt answer questions reasonable (all same answer for everything), ...
    for pid in ['615e1782e969d4939045c54f', '59f66d8f7086f8000194141c', '604011377e5b121dc3267a3e', '63eb770028f67bdcb53f070d', '5f06eefaf3fc742667b4e79d', '5f5128c3aa1c4e30e4506d2c']:
        df_finished = df_finished[df_finished.PID != pid]
        df_survey = df_survey[df_survey.PID != pid]
        df_ranking = df_ranking[df_ranking.PID != pid]
    #
    # df_finished = df_finished[df_finished.PID != '6228f5900f303f54ca6ab186']
    # df_survey = df_survey[df_survey.PID != '6228f5900f303f54ca6ab186']
    # df_ranking = df_ranking[df_ranking.PID != '6228f5900f303f54ca6ab186']
    #
    # 5bbd033261968f0001f02bac, 63eb770028f67bdcb53f070d

    # UNUSED TOP and BOTTOM PERFORMERS
    # median = df_finished.soups_served.median()
    # top_PIDS = df_finished[df_finished['soups_served'] > median].PID.unique()
    # bottom_PIDS = df_finished[df_finished['soups_served'] <= median].PID.unique()
    # print(median)
    # df_finished = df_finished[df_finished.soups_served > median]
    # df_finished = df_finished[df_finished['soups_served'] < 100]
    # mean = df_finished['soups_served'].mean()
    # std  = df_finished['soups_served'].std()
    #
    # print(mean)
    # print(std)
    #
    # print(df_finished[df_finished['soups_served'] < (mean - 2 * std)])

    # df_finished = df_finished[df_finished['soups_served'] >= 23]#(mean - 2 * std)]
    # exit(0)

    fin_PIDs = df_finished.PID.unique()


    agent_names = df_survey.agent_name.unique()
    layout_names = df_survey.layout_name.unique()
    # Filters
    # FINISHED FILTER -- remove all participants who did not complete the trial
    df_survey = df_survey[df_survey.PID.isin(fin_PIDs)]
    print('>?', len(df_survey))
    df_survey = df_survey[df_survey.SESSION_ID.isin(df_finished.SESSION_ID)]
    print('>?', len(df_survey))

    # MINIMAL PLAYER FILTER -- remove all rounds where the human performed fewer than 5 subtasks
    # let's massage this into the format above to skip re-writing the preprocessing
    human_completed_subtasks = {agent_name: [] for agent_name in df_survey['agent_name'].unique()}
    # print(agent_names, agent_names + ["human"])
    num_subtask_comp = {k: [] for k in [*agent_names, "human"]}
    rows_to_drop = []
    for i, row in df_survey.iterrows():
        subtask_completion = json.loads(row['subtask_completion'])
        human_completed_subtasks[row['agent_name']].append(subtask_completion['human'])
        num_subtask_comp['human'].append(len(subtask_completion['human']))
        num_subtask_comp[row['agent_name']].append(len(subtask_completion[row['agent_name']]))
        if len(subtask_completion['human']) < 5:# or len(subtask_completion[row['agent_name']]) < 2:
            rows_to_drop.append((row['PID'], row['layout_name']))
        # elif row['round_score'] == 0:
        #     rows_to_drop.append((row['PID'], row['layout_name']))

    for pid, ln in rows_to_drop:
        df_survey = df_survey[~((df_survey['PID'] == pid) & (df_survey['layout_name'] == ln))]
        df_ranking = df_ranking[~((df_ranking['PID'] == pid) & (df_ranking['layout_name'] == ln))]

    # num_entries_per_pid_layout = {}
    # for pid in df_survey.PID.unique():
    #     for ln in layout_names:
    #         num_entries_per_pid_layout[pid + '|' + ln] = 0
    #
    # rows_to_drop =[]
    # for i, row in df_survey.iterrows():
    #     num_entries_per_pid_layout[row['PID'] + '|' + row['layout_name']] += 1
    #     if num_entries_per_pid_layout[row['PID'] + '|' + row['layout_name']] > 2:
    #         rows_to_drop.append((row['PID'], row['layout_name'], row['Created']))
    #
    # for pid, ln, time in rows_to_drop:
    #     df_survey = df_survey[~((df_survey['PID'] == pid) & (df_survey['layout_name'] == ln) & (row['Created'] == time))]
    #
    #
    # for k, v in num_entries_per_pid_layout.items():
    #     if v < 2:
    #         pid, ln = k.split('|')
    #         df_survey= df_survey[~((df_survey['PID'] == pid) & (df_survey['layout_name'] == ln))]

    all_PIDs = df_survey.PID.unique()
    print('>', len(df_survey))
    print(f'Number of included participant: {len(all_PIDs)}')




    for k, v in num_subtask_comp.items():
        print(f'num {k} subtask completions: mean {np.mean(v)}, {np.std(v)}, {np.min(v)}, {np.max(v)}')
        # df_survey[f'{k}_subtask_completion'] = v

    return df_survey, df_ranking, df_finished