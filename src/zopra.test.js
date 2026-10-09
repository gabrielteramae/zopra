import assert from "node:assert/strict";
import test from "node:test";
import { flattenChildren, hueToRgb } from "./zopra.js";

test("cor negativa fecha o círculo", () => {
    assert.deepEqual(hueToRgb(-30), hueToRgb(330));
});

test("filhos em array não somem", () => {
    const span = { tag: "span" };
    assert.deepEqual(flattenChildren([[span, null], false, "ok"]), [span, "ok"]);
});
