FROM medbook/meteor-base:v1.2.1_7

MAINTAINER Mike Risse

# Install python requirements (for downloading)
RUN apt-get update
RUN apt-get install -y --force-yes --no-install-recommends \
    python-pip \
    python-dev \
    build-essential
RUN easy_install pip
RUN pip install --upgrade virtualenv
RUN pip install pymongo
