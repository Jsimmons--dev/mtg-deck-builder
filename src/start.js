import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { makeExecutableSchema } from "graphql-tools";
import cors from "cors";
import { prepare } from "../util/index";

const app = express();

app.use(cors());

const homePath = "/graphiql";
const URL = "http://localhost";
const PORT = 3001;
const MONGO_URL = "mongodb://localhost:27018/test";

export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL);

    const Cards = db.collection("scryfall-default-cards");

    const typeDefs = [
      `
      type Query {
        card(_id: String): Card
        cards(name: String, cmc:Int): [Card]
      }

      type ImageMap {
        small: String
        normal: String
        large: String
        png: String
        art_crop: String
        border_crop: String
      }

      type Card {
        _id: String
        name: String
        object: String
        oracle_id: String
        lang: String
        released_at: String
        uri: String
        scryfall_uri: String
        layout: String
        highres_image: Boolean
        image_uris: ImageMap
        mana_cost: String
        cmc: Int
        type_line: String
        oracle_text: String
        power: String
        toughness: String
        colors: [String]
        color_identity: [String]
        legalities: [String]
        artist: String
        card_back_id: String
        flavor_text: String
        rarity: String
      }


      schema {
        query: Query
      }
    `
    ];

    const resolvers = {
      Query: {
        card: async (root, { _id }) => {
          return prepare(await Cards.findOne(ObjectId(_id)));
        },
        cards: async (root, stuff) => {
          console.log(root, stuff);

          return (await Cards.find(stuff).toArray()).map(prepare);
        }
      },
      Card: {}
    };

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    app.use("/graphql", bodyParser.json(), graphqlExpress({ schema }));

    app.use(
      homePath,
      graphiqlExpress({
        endpointURL: "/graphql"
      })
    );

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`);
    });
  } catch (e) {
    console.log(e);
  }
};
