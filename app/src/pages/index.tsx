import { Home } from "~/components/page";
// import { css } from "../../styled-system/css";

export default async function HomePage() {
  const data = await getData();

  return (
    <div>
      <title>{data.title}</title>
      {/* <h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>
        {data.headline}
      </h1>
      <p>{data.body}</p> */}

      <Home />
    </div>
  );
}

const getData = async () => {
  const data = {
    title: "Maroo Faucet - Get Test Tokens",
    headline: "Maroo Testnet Faucet",
    body: "Hello world!",
  };

  return data;
};

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
