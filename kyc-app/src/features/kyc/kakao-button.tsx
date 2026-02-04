import { css } from "@maroo/styled-system/css";
import { Button } from "@maroo/ui";
import IconKakao from "@maroo/ui/assets/icon-kakao.svg?react";

export const KakaoButton = ({ onClick }: { onClick?: () => void }) => (
  <Button color="kakao" onClick={onClick}>
    <IconKakao className={css({ mr: "8px" })} /> Verify with Kakao
  </Button>
);
