import os
import pandas as pd

topic = pd.read_pickle(os.path.join('..', 'pickle_jar', 'my_serialized_data'))

posts_df = pd.DataFrame(topic['posts'],
                      columns=['id', 'title', 'created_at', 'author_id'])
users_df = pd.DataFrame(topic['users'], columns=['id', 'name'])


print(posts_df)
print(users_df)
