import { css } from "styled-system/css";
import IconKakao from "~/shared/assets/icon-kakao.svg?react";
import { Button } from "~/shared/ui/button";

export const KakaoButton = ({ onClick }: { onClick?: () => void }) => (
  <Button color="kakao" onClick={onClick}>
    <IconKakao className={css({ mr: "8px" })} /> Verify with Kakao
  </Button>
);
