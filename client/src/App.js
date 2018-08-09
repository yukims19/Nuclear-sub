import React, { Component } from "react";
import "./App.css";
import explosion from "./explosion.mp3";
import rockAudio from "./rockit.mp3";
import warning from "./warning.png";
import fire from "./fire.jpg";
import OneGraphAuth from "onegraph-auth";
import idx from "idx";

const APP_ID = "516cef75-892e-4a92-a0b2-82868e802e33";
const auth = new OneGraphAuth({
  appId: APP_ID
});

class GetEmails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalNum: 0,
      cursor: 0,
      unsubEmails: []
    };
  }
  componentDidMount() {
    const helper = async () => {
      await this.loadData();
      setTimeout(helper, 100);
    };
    setTimeout(helper, 100);
  }

  handleClick() {
    var explosion = document.getElementById("myAudio");
    explosion.play();
    const rockAudio = document.getElementById("rock");
    rockAudio.pause();
    rockAudio.volume = 0.0;
    setTimeout(() => {
      rockAudio.play();
      setInterval(() => {
        if (rockAudio.volume < 0.7) {
          rockAudio.volume += 0.1;
        }
      }, 1000);
    }, 5000);

    document
      .getElementsByClassName("App-main")[0]
      .classList.add("shake-hard", "shake-constant");
    setTimeout(() => {
      document
        .getElementsByClassName("App-main")[0]
        .classList.remove("shake-hard", "shake-constant");
    }, 4000);
    setInterval(() => this.unsubscribeAll(this.state.cursor), 100);
    //this.unsubscribeAll(this.state.cursor);
  }

  loadData = async () => {
    const response = await fetch("/status");
    const body = await response.json();
    this.setState({
      totalNum: body.allEmails,
      cursor: parseInt(body.count, 10)
    });
    if (response.status !== 200) throw Error(body.message);
    return body;
    /*
           let newUnsubEmails = this.state.unsubEmails.slice();
           newUnsubEmails = newUnsubEmails.concat(body);
      this.setState({ unsubEmails: newUnsubEmails });
      let newCursor = body;*/
  };

  unsubscribeAll = async cursor => {
    const response = await fetch("/unsubscribe", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" }
    });
    try {
      const body = await response.json();
      let newUnsubEmails = this.state.unsubEmails.slice();
      newUnsubEmails = newUnsubEmails.concat(body.unsubscribedEmails);
      this.setState({ unsubEmails: newUnsubEmails });
    } catch (response) {
      const body = await response;
      if (response.status !== 200) throw Error(body.message);
    }
  };

  render() {
    return (
      <div>
        <header className="App-main">
          <img id="fire-left" src={fire} alt="fire" />
          <img id="fire-right" src={fire} alt="fire" />
          <div className="unsubscribed-emails">
            {this.state.unsubEmails
              ? this.state.unsubEmails.map(email => {
                  return (
                    <li>
                      {email}
                    </li>
                  );
                })
              : ""}
          </div>
          <audio id="myAudio">
            <source src={explosion} type="audio/mpeg" />
          </audio>
          <div className="marquee">
            <h1 className="App-title">
              <span className="yellow">Welcome to</span>{" "}
              <span className="red">Nuclear-sub</span>
            </h1>
          </div>
          <p className="loaded-emails">
            {" "}{this.state.totalNum} emails loaded
          </p>
          <div className="progress">
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              aria-valuenow={this.state.cursor / this.state.totalNum * 100}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{
                width: this.state.cursor / this.state.totalNum * 100 + "%"
              }}
            >
              Unsubscribed {this.state.cursor} emails
            </div>
          </div>
          {this.state.isLoading
            ? "loading"
            : <button
                id="unsubscribebtn"
                onClick={() => this.handleClick()}
                ref="unsubscribebtn"
                onMouseOver={() => {
                  this.refs.imgWarning.style.display = "inline-block";
                }}
                onMouseOut={() => {
                  this.refs.imgWarning.style.display = "none";
                }}
              >
                Unsubscribe All<br />
                <img
                  id="img-warning"
                  src={warning}
                  alt="Warning!"
                  ref="imgWarning"
                />
              </button>}
          <br />
        </header>
      </div>
    );
  }
}

const GET_Emails = `
  query {
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
  }
`;

const GET_GmailId = `
  query {
    me {
      gmail {
        email
      }
    }
  }
`;

class LoginButton extends Component {
  render() {
    return (
      <button
        className={"loginbtn loginbtn-google"}
        onClick={this.props.onClick}
      >
        <i className={"fab fa-google"}> </i> <span> </span>Login with{" "}
        {" " + this.props.event}
      </button>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //isNuclear: true,
      gmail: false,
      email: null
    };
    this.isLoggedIn("gmail");
  }
  componentDidMount() {
    if (this.state.isNuclear) {
      const rockAudio = document.getElementById("rock");
      rockAudio.loop = true;
      rockAudio.play();
    }
  }
  callLogin = async (token, data) => {
    const email = idx(data, _ => _.me.gmail.email);
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
    const emails = idx(data, _ => _.google.gmail.threads.threads);
    const response = await fetch("/store", {
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
      <div className={this.state.isNuclear ? "App-nuclear" : "App"}>
        <audio id="rock" allow="autoplay">
          <source src={rockAudio} type="audio/mpeg" />
        </audio>
        {//this.state.gmail
        true
          ? <GetEmails email={this.state.email} />
          : <div>
              <div className="App-login">
                <h1 className="App-title">Welcome to Nuclear-sub</h1>
                <p>Unsubscribe your emails!</p>
                <div className="login-google">
                  {this.renderButton("Gmail", "gmail")}
                </div>
              </div>
            </div>}
        <div className="card-footer">
          Made with <i className="fas fa-heart" /> By Youxi Li on OneGraph
        </div>
      </div>
    );
  }
}

export default App;
