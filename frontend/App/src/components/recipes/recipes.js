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
import SearchFilter from "./search/search";

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
    this.searchRef = createRef();
  }

  state = {
    loading: true,
    recipes: [],
  };

  componentDidMount() {
    this.searchRecipes(this.searchRef.current.getSearch());
  }

  searchRecipes = (search) => {
    this.setState({ loading: true });
    this.api
      .query({
        query: gql`
          query ($search: SearchRecipeType!, $token: String!) {
            search(search: $search, token: $token) {
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
        variables: {
          search,
          token: this.authService.getToken(),
        },
      })
      .then((res) => {
        this.setState({ recipes: res.data.search, loading: false });
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
        <SearchFilter load={this.searchRecipes} ref={this.searchRef} />
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

    if (this.state.recipes.length === 0) {
      return (
        <div className="no-recipes-container">
          <h4>Keine Rezepte gefunden.</h4>
        </div>
      );
    }

    return (
      <div className="row">
        {this.state.recipes.map((recipe, index) => (
          <div
            className="col-sm-12 col-md-6 col-lg-4 col-xxl-3 recipe-card"
            key={index}
          >
            <a href={"/recipes/" + recipe.id}>
              <CardFrame>
                <Cardheader>
                  <h4>
                    {recipe.title} <small>{recipe.preptime} min.</small>
                  </h4>
                </Cardheader>
                <CardBody>
                  <div>
                    <span className="badge people-container">
                      {recipe.people} Personen
                    </span>
                    <span className="badge people-container">
                      Zubereitet:{" "}
                      <Datetime value={recipe.last_cooked} format="date" />
                    </span>
                  </div>
                  <p dangerouslySetInnerHTML={{ __html: recipe.description }} />
                </CardBody>
                <CardFooter>
                  <span className="tags-container">
                    {recipe.tags.map((tag, t_index) => (
                      <span className="badge rounded-pill" key={t_index}>
                        {tag.value}
                      </span>
                    ))}
                  </span>
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
