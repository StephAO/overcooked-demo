FROM python:3.9

ARG BUILD_ENV
ARG OVERCOOKED_BRANCH
ARG AGENT_BRANCH
ARG GRAPHICS

WORKDIR /app

# Install non-chai dependencies
COPY ./requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

# Install eventlet production server if production build
RUN if [ "$BUILD_ENV" = "production" ] ; then pip install eventlet==0.30.2 ; fi
# RUN pip install gunicorn==20.1.0 eventlet==0.30.2
# Clone oai_agents code
RUN git clone https://github.com/StephAO/overcooked_ai.git --branch $OVERCOOKED_BRANCH --single-branch /overcooked_ai
# TODO - remove personal auth token
RUN git clone https://github.com/StephAO/oai_agents.git --branch $AGENT_BRANCH --single-branch /oai_agents

# Is this necessary?
# Dummy data_dir so things don't break
# RUN echo "import os; DATA_DIR=os.path.abspath('.')" >> /human_aware_rl/human_aware_rl/data_dir.py

# Install CPU pytorch
RUN pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
# Install chai dependencies
RUN pip install -e /overcooked_ai
RUN pip install -e /oai_agents
RUN pip install pyairtable

RUN apt-get update
RUN apt-get install -y libgl1-mesa-dev

# Copy over remaining files
COPY ./static ./static
COPY ./*.py ./
COPY ./graphics/$GRAPHICS ./static/js/graphics.js
COPY ./config.json ./config.json


# Set environment variables that will be used by app.py

ENV CONF_PATH config.json

# Set airtable api key
ENV AIRTABLE_API_KEY key9qXD3bda1nLxfH

# Do the thing
EXPOSE 5000
ENV HOST 0.0.0.0
ENV PORT 5000

CMD ["python", "-u", "app.py"]
# RUN gunicorn --worker-class eventlet -w 1 app:app
# CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "app:app"]
# RUN if [ "$BUILD_ENV" = "production" ] ; then gunicorn --worker-class eventlet -w 1 module:app ; else CMD ["python", "-u", "app.py"]; fi