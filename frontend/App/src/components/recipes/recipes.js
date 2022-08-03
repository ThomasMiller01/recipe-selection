import React, { Component, createRef } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { gql } from "apollo-boost";

import { backend_api, auth_api } from "../api_urls";
import Page from "../page";

import CardFrame from "library/src/components/Card/card_frame";
import Cardheader from "library/src/components/Card/card_header";
import CardBody from "library/src/components/Card/card_body";
import CardFooter from "library/src/components/Card/card_footer";

import AuthService from "library/src/components/AuthService/authservice";
import Datetime from "library/src/components/Datetime/datetime";
import AlertMessage from "library/src/components/AlertMessage/alertmessage";

import "./recipes.scss";

class Recipes extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.authService = new AuthService(auth_api, "recipe-selection-token");

    this.api = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: backend_api,
      }),
    });

    this.alertRef = createRef();
  }

  state = {
    loading: true,
    recipes: [],
  };

  componentDidMount() {
    this.getRecipes();
  }

  getRecipes = () => {
    this.api
      .query({
        query: gql`
          query ($token: String!) {
            recipes(token: $token) {
              id
              title
              description
              preptime
              people
              last_cooked
              tags {
                id
                value
              }
            }
          }
        `,
        variables: { token: this.authService.getToken() },
      })
      .then((res) => {
        this.setState({ recipes: res.data.recipes, loading: false });
      })
      .catch((_) => {
        this.alertRef.current.alert(
          "Could not load recipes ...",
          "error",
          5000
        );
        this.setState({ loading: false });
      });
  };

  render() {
    return (
      <Page>
        <AlertMessage ref={this.alertRef} />
        <this.renderRecipes />
      </Page>
    );
  }

  renderRecipes = () => {
    if (this.state.loading) {
      return (
        <div className="recipe-loading-container">
          <div className="spinner-grow" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="row">
        {this.state.recipes.map((recipe, index) => (
          <div className="col recipe-card" key={index}>
            <a href={"/recipes/" + recipe.id}>
              <CardFrame>
                <Cardheader>
                  <h4>
                    {recipe.title} <small>{recipe.preptime} min.</small>
                  </h4>
                </Cardheader>
                <CardBody>
                  <div>
                    <span className="badge people-container" key={index}>
                      {recipe.people} Personen
                    </span>
                    <span className="badge people-container" key={index}>
                      Zubereitet:{" "}
                      <Datetime value={recipe.last_cooked} format="date" />
                    </span>
                  </div>
                  <p>{recipe.description}</p>
                  <p></p>
                </CardBody>
                <CardFooter>
                  <div className="tags-container">
                    {recipe.tags.map((tag, index) => (
                      <span className="badge rounded-pill" key={index}>
                        {tag.value}
                      </span>
                    ))}
                  </div>
                </CardFooter>
              </CardFrame>
            </a>
          </div>
        ))}
      </div>
    );
  };
}

export default Recipes;
