import React, { Component } from "react";
import "./App.css";
import { gql } from "apollo-boost";
import { ApolloProvider, Query } from "react-apollo";
import OneGraphApolloClient from "onegraph-apollo-client";
import OneGraphAuth from "onegraph-auth";
import idx from "idx";

const APP_ID = "516cef75-892e-4a92-a0b2-82868e802e33";
const auth = new OneGraphAuth({
  appId: APP_ID
});
const client = new OneGraphApolloClient({
  oneGraphAuth: auth
});

class GetEmails extends Component {
  handleClick() {
    console.log("clicked");
  }
  render() {
    return (
      <button className="get-emails" onClick={() => this.handleClick()}>
        Get Emails
      </button>
    );
  }
}

const GET_Emails = `query{
google {
    gmail {
      threads(q: "Unsubscribe", maxResults: 10) {
        threads {
          expanded {
            messages {
              sizeEstimate
              payload {
                to
                from
                subject
                parts {
                  body {
                    decodedData
                  }
                  to
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const GET_GmailId = `query {
                                    me {
                                      gmail {
                                        email
                                      }
                                    }
                                  }`;

class LoginButton extends Component {
  render() {
    return (
      <button
        className={"loginbtn loginbtn-" + this.props.eventClass}
        onClick={this.props.onClick}
      >
        <i className={"fab fa-" + this.props.eventClass} />
        <span> </span>Login with {this.props.event}
      </button>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gmail: false
    };
    //this.isLoggedIn("gmail");
  }

  isLoggedIn(event) {
    auth.isLoggedIn(event).then(isLoggedIn => {
      this.setState({
        [event]: isLoggedIn
      });
    });
  }

  callLogin = async (token, data) => {
    console.log("calllogin");
    const email = data.me.gmail.email;
    console.log(email);
    const response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify({ token: token, email: email }),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res)
      .catch(err => err);

    const body = await response;
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  callEmails = async (token, data) => {
    console.log("callemails");
    const emails = data.google.gmail.threads.threads;
    console.log(emails);
    const response = await fetch("/emails", {
      method: "POST",
      body: JSON.stringify({ data: emails }),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res)
      .catch(err => err);

    const body = await response;
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  fetchOneGraphQuery(query, v, callServer) {
    const token = JSON.parse(
      localStorage.getItem("oneGraph:516cef75-892e-4a92-a0b2-82868e802e33")
    )["accessToken"];
    fetch(
      "https://serve.onegraph.com/dynamic?app_id=516cef75-892e-4a92-a0b2-82868e802e33",
      {
        method: "POST",
        body: JSON.stringify({
          query: query,
          variables: v
        }),
        headers: {
          Authentication: "Bearer " + token,
          Accept: "application/json"
        }
      }
    )
      .then(res => res.json())
      .catch(error => error.json())
      .then(json => {
        const data = json.data;
        callServer(token, data).then(res => res);
      });
  }

  handleClick(service) {
    console.log(auth);
    try {
      auth.login(service).then(() => {
        auth.isLoggedIn(service).then(isLoggedIn => {
          if (isLoggedIn) {
            console.log("Successfully logged in to " + service);
            this.setState({
              [service]: isLoggedIn
            });
            this.fetchOneGraphQuery(GET_Emails, null, this.callEmails);
            this.fetchOneGraphQuery(GET_GmailId, null, this.callLogin);
          } else {
            console.log("Did not grant auth for service " + service);
            this.setState({
              service: isLoggedIn
            });
          }
        });
      });
    } catch (e) {
      console.error("Problem logging in", e);
    }
  }

  renderButton(eventTitle, eventClass) {
    return (
      <LoginButton
        event={eventTitle}
        eventClass={eventClass}
        onClick={() => this.handleClick(eventClass)}
      />
    );
  }
  render() {
    return (
      <div className="App">
        {this.state.gmail
          ? <header className="App-header">
              <h1 className="App-title">Welcome to React</h1>
              <GetEmails />
            </header>
          : <div>
              <div className="login-background">Nuclear-sub</div>
              <div className="login-eventilbtn">
                {this.renderButton("Gmail", "gmail")}
              </div>
            </div>}
      </div>
    );
  }
}

export default App;

/*
storeAuthToken() {
    const token = JSON.parse(
        localStorage.getItem("oneGraph:516cef75-892e-4a92-a0b2-82868e802e33")
    )["accessToken"];

    const GET_GmailId = `query {
                                    me {
                                      gmail {
                                        email
                                      }
                                    }
                                  }`;
    fetch(
        "https://serve.onegraph.com/dynamic?app_id=516cef75-892e-4a92-a0b2-82868e802e33",
        {
            method: "POST",
            body: JSON.stringify({
                query: GET_GmailId,
                variables: null
            }),
            headers: {
                Authentication: "Bearer " + token,
                Accept: "application/json"
            }
        }
    )
        .then(res => res.json())
        .catch(error => error.json())
        .then(json => {
            const email = json.data.me.gmail.email;
            this.callLogin(token, email).then(res => {
                console.log(res);
            });
        });


    getUnsubscirbeEmails() {
        const token = JSON.parse(
            localStorage.getItem("oneGraph:516cef75-892e-4a92-a0b2-82868e802e33")
        )["accessToken"];

        fetch(
            "https://serve.onegraph.com/dynamic?app_id=516cef75-892e-4a92-a0b2-82868e802e33",
            {
                method: "POST",
                body: JSON.stringify({
                    query: GET_Emails,
                    variables: null
                }),
                headers: {
                    Authentication:
            "Bearer " + "D7fgtY_3MO6IdINpBSG7dvFmJKeJXYPkmeg52Uhvgks",
                    Accept: "application/json"
                }
            }
        )
            .then(res => res.json())
            .catch(error => error.json())
            .then(json => {
                console.log(
                    json.data.google.gmail.threads.threads[0].expanded.messages[0].payload
                        .subject
                );
                /*
                   const email = json.data.me.gmail.email;
                   this.callLogin(token, email).then(res => {
                   console.log(res);
                   });
            });
    }
}*/
