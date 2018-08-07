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
  constructor(props) {
    super(props);
    this.state = {
      totalNum: 0,
      isLoading: true,
      cursor: 0
    };
  }
  componentDidMount() {
    if (this.state.isLoading) {
      //setInterval(() => this.loadData(), 1000);
    }
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (this.state.isLoading) {
      if (this.props.totalNum === prevProps.totalNum) {
        this.setState({ isLoading: false });
      }
    }
    if (!this.state.isLoading) {
      if (this.props.totalNum !== prevProps.totalNum) {
        this.setState({ isLoading: true });
      }
    }
    console.log(this.state.isLoading);
  }

  handleClick() {
    console.log("clicked");
    //setInterval(() => this.unsubscribeAll(this.state.cursor), 1000);
    this.unsubscribeAll(this.state.cursor);
  }

  loadData = async () => {
    const response = await fetch("/process");
    const body = await response.json();
    this.setState({ totalNum: body[0].count });
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  unsubscribeAll = async cursor => {
    console.log("unsubscribeAll");
    const response = await fetch("/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ cursor: this.state.cursor }),
      headers: { "Content-Type": "application/json" }
    });
    const body = await response.json();
    let newCursor = this.state.cursor + body.length;
    this.setState({ cursor: newCursor });
    console.log(this.state.cursor);
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  render() {
    return (
      <div>
        <header className="App-header">
          <h1 className="App-title">Welcome to Nuclear-sub</h1>
          <p>
            {" "}{this.state.totalNum} loaded
          </p>
          <p>
            {" "}{this.state.cursor} unsubscribed
          </p>
        </header>
        {this.state.isLoading
          ? "loading"
          : <button className="get-emails" onClick={() => this.handleClick()}>
              Unsubscribe Emails
            </button>}
      </div>
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
                listUnsubscribe {
                  mailto
                  http
                }
                to
                from
                subject

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
      gmail: false,
      email: null
    };
    this.isLoggedIn("gmail");
  }

  callLogin = async (token, data) => {
    console.log("calllogin");
    const email = data.me.gmail.email;
    console.log(email);
    this.setState({
      email: email
    });
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

  isLoggedIn(event) {
    auth.isLoggedIn(event).then(isLoggedIn => {
      this.setState({
        [event]: isLoggedIn
      });
      if (isLoggedIn) {
        this.fetchOneGraphQuery(GET_GmailId, null, this.callLogin);
      }
    });
  }

  handleClick(service) {
    try {
      auth.login(service).then(() => {
        auth.isLoggedIn(service).then(isLoggedIn => {
          if (isLoggedIn) {
            console.log("Successfully logged in to " + service);
            this.setState({
              [service]: isLoggedIn
            });
            this.fetchOneGraphQuery(GET_GmailId, null, this.callLogin);
            this.fetchOneGraphQuery(GET_Emails, null, this.callEmails);
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
          ? <GetEmails email={this.state.email} />
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
