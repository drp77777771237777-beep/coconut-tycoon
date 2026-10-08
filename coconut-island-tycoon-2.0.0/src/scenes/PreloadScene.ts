import Phaser from 'phaser';
import { FONT, SCENES } from '../core/GameConfig';

type Gfx = Phaser.GameObjects.Graphics;

/**
 * Placeholder art: every sprite is drawn procedurally (iso-style, ~35 degree look-down) so the
 * prototype needs no asset files. Swap for real sprite sheets later by loading them under the same keys.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.preload);
  }

  create(): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Loading...', { fontFamily: FONT, fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);

    const g = this.make.graphics({ x: 0, y: 0 }, false) as Gfx;
    this.makePixel(g);
    for (const dir of ['down', 'up', 'left', 'right'] as const) this.makePlayer(g, dir);
    this.makeTree(g, 'tree_full', true);
    this.makeTree(g, 'tree_empty', false);
    this.makeTree(g, 'tree_golden_full', true, [0xd9b823, 0xf2cf3a, 0xffe45c], 0xffc400);
    this.makeTree(g, 'tree_golden_empty', false, [0xd9b823, 0xf2cf3a, 0xffe45c], 0xffc400);
    this.makeTemple(g);
    this.makeBoss(g, 'boss_gold', { body: 0xb8902c, head: 0xe0b440, dark: 0x7a5c14, eye: 0x6bffb0, core: 0xfff2a0 });
    this.makeTree(g, 'tree_jungle_full', true, [0x1c6e2f, 0x258a3c, 0x33a84a], 0x5a3a14);
    this.makeTree(g, 'tree_jungle_empty', false, [0x1c6e2f, 0x258a3c, 0x33a84a], 0x5a3a14);
    this.makeBoss(g, 'boss_treant', { body: 0x6b4a2a, head: 0x8a6234, dark: 0x3e2a14, eye: 0xffd23f, core: 0x6bff6b }, () => {
      g.fillStyle(0x2f9e44, 1).fillTriangle(6, 28, 20, 0, 34, 24).fillTriangle(30, 24, 48, -2, 62, 22).fillTriangle(58, 24, 76, 2, 88, 28);
      g.lineStyle(4, 0x2f9e44, 1).lineBetween(6, 70, 6, 120).lineBetween(124, 70, 124, 118).lineBetween(100, 52, 112, 100);
    });
    this.makeTree(g, 'tree_volcano_full', true, [0x5a2a1a, 0x7a3a22, 0xa8502c], 0xff7a1a);
    this.makeTree(g, 'tree_volcano_empty', false, [0x5a2a1a, 0x7a3a22, 0xa8502c], 0xff7a1a);
    this.makeBoss(g, 'boss_magma', { body: 0x4a3a38, head: 0x6a5048, dark: 0x241a18, eye: 0xffb03a, core: 0xff5a1a }, () => {
      g.fillStyle(0xff7a1a, 1).fillTriangle(10, 26, 22, 4, 34, 24).fillTriangle(40, 22, 58, 0, 74, 22).fillTriangle(80, 24, 98, 4, 112, 26);
      g.lineStyle(4, 0xff5a1a, 1).lineBetween(8, 70, 8, 118).lineBetween(122, 70, 122, 116).lineBetween(96, 50, 110, 98);
    });
    this.makeCrab(g);
    this.makeThemeProps(g);
    this.makeMisc(g);
    this.makeCoconut(g);
    this.makeSellStand(g);
    this.makeShop(g);
    this.makeHireHut(g);
    this.makeStorage(g);
    this.makeRock(g);
    this.makePier(g);
    this.makeBoat(g);
    g.destroy();

    this.scene.start(SCENES.menu);
  }

  private done(g: Gfx, key: string, w: number, h: number): void {
    g.generateTexture(key, w, h);
    g.clear();
  }

  private makePixel(g: Gfx): void {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
    this.done(g, 'pixel', 4, 4);
  }

  private makePlayer(g: Gfx, dir: 'down' | 'up' | 'left' | 'right'): void {
    // legs
    g.fillStyle(0x3b4a6b, 1).fillRect(10, 36, 5, 11).fillRect(17, 36, 5, 11);
    g.fillStyle(0x2a2a2a, 1).fillRect(9, 45, 7, 3).fillRect(16, 45, 7, 3);
    // shirt (front lit, side darker for volume)
    g.fillStyle(0xff8a3d, 1).fillRoundedRect(7, 18, 18, 20, 5);
    g.fillStyle(0xe06e22, 1).fillRoundedRect(19, 18, 6, 20, 3);
    // head
    g.fillStyle(0xf2c28b, 1).fillCircle(16, 12, 9);
    if (dir === 'up') g.fillStyle(0x5a3a1c, 1).fillCircle(16, 12, 9);
    // eyes
    g.fillStyle(0x222222, 1);
    if (dir === 'down') g.fillCircle(12.5, 13, 1.4).fillCircle(19.5, 13, 1.4);
    if (dir === 'left') g.fillCircle(11, 13, 1.4);
    if (dir === 'right') g.fillCircle(21, 13, 1.4);
    // straw hat
    g.fillStyle(0xf5d76e, 1).fillEllipse(16, 6, 28, 8).fillStyle(0xe0b83e, 1).fillEllipse(16, 4, 14, 8);
    this.done(g, `player_${dir}`, 32, 48);
  }

  private makeTree(g: Gfx, key: string, withCoconuts: boolean, leaves: number[] = [0x2f9e44, 0x3dbb55, 0x4cd16a], nut = 0x7a4a21): void {
    const cx = 48;
    // trunk
    g.fillStyle(0x8a5a2b, 1).fillPoints(
      [
        new Phaser.Geom.Point(41, 128),
        new Phaser.Geom.Point(55, 128),
        new Phaser.Geom.Point(57, 86),
        new Phaser.Geom.Point(53, 52),
        new Phaser.Geom.Point(45, 52),
        new Phaser.Geom.Point(45, 86),
      ],
      true,
    );
    g.fillStyle(0x6b431d, 1).fillRect(51, 54, 4, 74);
    g.lineStyle(2, 0x6b431d, 0.8);
    for (let y = 62; y < 126; y += 12) g.lineBetween(44, y, 56, y + 3);
    // fronds
    const angles = [-170, -135, -100, -60, -20, 15, 50, 135, 170].map((a) => Phaser.Math.DegToRad(a));
    angles.forEach((a, i) => {
      const tipX = cx + Math.cos(a) * 46;
      const tipY = 46 + Math.sin(a) * 24 + 10;
      const mx = cx + Math.cos(a) * 20;
      const my = 46 + Math.sin(a) * 10 - 4;
      const px = -Math.sin(a) * 9;
      const py = Math.cos(a) * 5;
      g.fillStyle(i % 2 ? leaves[0] : leaves[1], 1).fillPoints(
        [
          new Phaser.Geom.Point(cx, 48),
          new Phaser.Geom.Point(mx + px, my + py),
          new Phaser.Geom.Point(tipX, tipY),
          new Phaser.Geom.Point(mx - px, my - py),
        ],
        true,
      );
    });
    g.fillStyle(leaves[2], 1).fillCircle(cx, 46, 8);
    if (withCoconuts) {
      g.fillStyle(nut, 1).fillCircle(42, 58, 6).fillCircle(54, 60, 6).fillCircle(48, 66, 6);
      g.fillStyle(0xa8703a, 1).fillCircle(40, 56, 2).fillCircle(52, 58, 2).fillCircle(46, 64, 2);
    }
    this.done(g, key, 96, 128);
  }

  private makeTemple(g: Gfx): void {
    g.fillStyle(0x8f8a7a, 1).fillRect(10, 96, 150, 54);
    g.fillStyle(0xa8a28f, 1).fillRect(28, 62, 114, 36);
    g.fillStyle(0xbdb7a1, 1).fillRect(50, 30, 70, 34);
    g.fillStyle(0xffd23f, 1).fillTriangle(85, 4, 62, 32, 108, 32);
    g.fillStyle(0x4d493d, 1).fillRect(10, 140, 150, 10);
    g.fillStyle(0x1d1b16, 1).fillRoundedRect(68, 100, 34, 50, { tl: 17, tr: 17, bl: 0, br: 0 });
    g.lineStyle(2, 0x6f6a5a, 1);
    for (let x = 30; x < 150; x += 24) g.lineBetween(x, 98, x, 140);
    g.fillStyle(0xc9a0ff, 1).fillCircle(85, 48, 6);
    this.done(g, 'temple', 170, 150);
  }

  private makeBoss(g: Gfx, key: string, c: { body: number; head: number; dark: number; eye: number; core: number }, extra?: () => void): void {
    g.fillStyle(c.body, 1).fillRoundedRect(20, 50, 90, 90, 10);
    g.fillStyle(c.head, 1).fillRoundedRect(10, 20, 80, 52, 10);
    g.fillStyle(c.body, 1).fillRect(0, 60, 24, 60).fillRect(106, 60, 24, 60);
    g.fillStyle(c.dark, 1).fillRect(28, 128, 28, 22).fillRect(74, 128, 28, 22);
    g.fillStyle(c.eye, 1).fillCircle(32, 42, 7).fillCircle(60, 42, 7);
    g.fillStyle(0xffffff, 1).fillCircle(32, 42, 3).fillCircle(60, 42, 3);
    g.lineStyle(3, c.dark, 1).lineBetween(26, 62, 66, 62).lineBetween(40, 90, 80, 110).lineBetween(70, 80, 90, 120);
    g.fillStyle(c.core, 1).fillRect(48, 84, 14, 14);
    extra?.();
    this.done(g, key, 130, 150);
  }

  private makeCrab(g: Gfx): void {
    g.lineStyle(5, 0xa83222, 1);
    for (let i = 0; i < 3; i++) {
      g.lineBetween(30 + i * 10, 74, 8 + i * 10, 96).lineBetween(90 - i * 10, 74, 112 - i * 10, 96);
    }
    g.fillStyle(0xe0523c, 1).fillEllipse(60, 68, 96, 56);
    g.fillStyle(0xf27a5a, 1).fillEllipse(56, 58, 60, 28);
    // claws
    g.fillStyle(0xd0412c, 1).fillCircle(14, 40, 18).fillCircle(106, 40, 18);
    g.fillStyle(0x16384a, 1).fillTriangle(14, 40, 0, 20, 22, 22).fillTriangle(106, 40, 120, 20, 98, 22);
    // eyes on stalks
    g.lineStyle(4, 0xa83222, 1).lineBetween(46, 48, 44, 30).lineBetween(74, 48, 76, 30);
    g.fillStyle(0xffffff, 1).fillCircle(44, 26, 7).fillCircle(76, 26, 7);
    g.fillStyle(0x222222, 1).fillCircle(44, 27, 3).fillCircle(76, 27, 3);
    // little crown
    g.fillStyle(0xffd23f, 1).fillTriangle(40, 10, 48, 0, 56, 10).fillTriangle(56, 10, 64, 0, 72, 10).fillRect(40, 8, 32, 5);
    this.done(g, 'boss_crab', 120, 100);
  }

  private makeThemeProps(g: Gfx): void {
    // spiral shell (rolling hazard)
    g.fillStyle(0xf2dcb0, 1).fillCircle(22, 22, 22);
    g.lineStyle(3, 0xd29a6a, 1).strokeCircle(22, 22, 14).strokeCircle(22, 22, 7);
    g.fillStyle(0xe8a98a, 1).fillCircle(22, 22, 3);
    this.done(g, 'shell', 44, 44);
    // big coconut (falling hazard)
    g.fillStyle(0x6b3f1a, 1).fillCircle(15, 15, 15);
    g.fillStyle(0x9a6a36, 1).fillCircle(10, 10, 5);
    g.fillStyle(0x3a2208, 1).fillCircle(15, 24, 2).fillCircle(20, 22, 2);
    this.done(g, 'coconut_big', 30, 30);
    // log (rolling hazard)
    g.fillStyle(0x8a5a2b, 1).fillCircle(22, 22, 22);
    g.fillStyle(0xc99a5a, 1).fillCircle(22, 22, 14);
    g.lineStyle(2, 0x6b431d, 1).strokeCircle(22, 22, 9).strokeCircle(22, 22, 4);
    this.done(g, 'log', 44, 44);
    // thorny seed (falling hazard)
    g.fillStyle(0x3e7a2a, 1).fillCircle(15, 15, 10);
    g.fillStyle(0x7fcf4a, 1);
    for (let a = 0; a < 8; a++) {
      const r = (a / 8) * Math.PI * 2;
      g.fillTriangle(15 + Math.cos(r - 0.25) * 9, 15 + Math.sin(r - 0.25) * 9, 15 + Math.cos(r + 0.25) * 9, 15 + Math.sin(r + 0.25) * 9, 15 + Math.cos(r) * 15, 15 + Math.sin(r) * 15);
    }
    this.done(g, 'thorn_seed', 30, 30);
    // ember boulder (rolling hazard)
    g.fillStyle(0x3a2a28, 1).fillCircle(22, 22, 22);
    g.fillStyle(0xff7a1a, 1).fillCircle(15, 14, 7).fillCircle(29, 28, 5);
    g.lineStyle(3, 0xffb03a, 1).lineBetween(8, 14, 30, 30).lineBetween(26, 6, 36, 24);
    this.done(g, 'ember', 44, 44);
    // lava rock (falling hazard)
    g.fillStyle(0x3a2a28, 1).fillCircle(15, 15, 15);
    g.fillStyle(0xff5a1a, 1).fillCircle(10, 10, 5).fillCircle(20, 20, 4);
    this.done(g, 'lava_rock', 30, 30);
    // gold nugget (rolling hazard)
    g.fillStyle(0xd4a017, 1).fillCircle(22, 22, 22);
    g.fillStyle(0xffe27a, 1).fillCircle(15, 14, 8);
    g.lineStyle(3, 0x8a6a0a, 1).lineBetween(8, 14, 30, 30).lineBetween(26, 6, 36, 24);
    this.done(g, 'nugget', 44, 44);
    // gold ore (falling hazard)
    g.fillStyle(0xc8961a, 1).fillPoints(
      [new Phaser.Geom.Point(15, 30), new Phaser.Geom.Point(2, 12), new Phaser.Geom.Point(12, 0), new Phaser.Geom.Point(28, 8), new Phaser.Geom.Point(26, 24)],
      true,
    );
    g.fillStyle(0xffe27a, 1).fillTriangle(12, 0, 28, 8, 14, 12);
    this.done(g, 'gold_rock', 30, 30);
  }

  private makeMisc(g: Gfx): void {
    g.fillStyle(0xffc400, 1).fillCircle(7, 7, 7);
    g.fillStyle(0xfff2a0, 1).fillCircle(5, 5, 3);
    this.done(g, 'coin_gold', 14, 14);

    g.fillStyle(0x8d909e, 1).fillCircle(22, 22, 22);
    g.lineStyle(3, 0x4d4f5a, 1).lineBetween(8, 14, 30, 30).lineBetween(26, 6, 36, 24);
    g.fillStyle(0xb5b8c4, 1).fillCircle(15, 14, 6);
    this.done(g, 'boulder', 44, 44);

    g.fillStyle(0x7d808e, 1).fillPoints(
      [new Phaser.Geom.Point(15, 30), new Phaser.Geom.Point(2, 12), new Phaser.Geom.Point(12, 0), new Phaser.Geom.Point(28, 8), new Phaser.Geom.Point(26, 24)],
      true,
    );
    this.done(g, 'rock_fall', 30, 30);

    g.fillStyle(0xffffff, 1).fillPoints(
      [new Phaser.Geom.Point(13, 0), new Phaser.Geom.Point(26, 13), new Phaser.Geom.Point(13, 26), new Phaser.Geom.Point(0, 13)],
      true,
    );
    g.fillStyle(0xffffff, 0.5).fillCircle(13, 13, 4);
    this.done(g, 'relic', 26, 26);

    g.fillStyle(0xe8453c, 1).fillRect(0, 0, 4, 4);
    this.done(g, 'spark', 4, 4);

    g.fillStyle(0x3b3730, 1).fillRoundedRect(0, 0, 64, 96, { tl: 32, tr: 32, bl: 0, br: 0 });
    g.fillStyle(0xc9a0ff, 0.8).fillRoundedRect(8, 10, 48, 86, { tl: 24, tr: 24, bl: 0, br: 0 });
    this.done(g, 'door', 64, 96);
  }

  private makeCoconut(g: Gfx): void {
    g.fillStyle(0x6b3f1a, 1).fillCircle(7, 7, 7);
    g.fillStyle(0x9a6a36, 1).fillCircle(5, 5, 3);
    this.done(g, 'coconut', 14, 14);
  }

  private makeSellStand(g: Gfx): void {
    // counter
    g.fillStyle(0xb9783c, 1).fillRect(14, 62, 100, 46);
    g.fillStyle(0x8f5a28, 1).fillRect(14, 98, 100, 10);
    g.fillStyle(0xd9a05c, 1).fillPoints(
      [new Phaser.Geom.Point(10, 62), new Phaser.Geom.Point(118, 62), new Phaser.Geom.Point(126, 52), new Phaser.Geom.Point(18, 52)],
      true,
    );
    g.fillStyle(0xffd54a, 1).fillCircle(64, 84, 12);
    g.lineStyle(3, 0xc79a1d, 1).strokeCircle(64, 84, 12);
    // posts
    g.fillStyle(0x6b431d, 1).fillRect(14, 20, 6, 44).fillRect(108, 20, 6, 44);
    // striped awning
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? 0xffffff : 0xe8453c, 1).fillPoints(
        [
          new Phaser.Geom.Point(4 + i * 15, 22),
          new Phaser.Geom.Point(19 + i * 15, 22),
          new Phaser.Geom.Point(23 + i * 15, 44),
          new Phaser.Geom.Point(i * 15, 44),
        ],
        true,
      );
    }
    this.done(g, 'sell_stand', 128, 112);
  }

  private makeShop(g: Gfx): void {
    g.fillStyle(0x5aa0e8, 1).fillRect(16, 52, 80, 66);
    g.fillStyle(0x3f80c8, 1).fillPoints(
      [new Phaser.Geom.Point(96, 52), new Phaser.Geom.Point(114, 42), new Phaser.Geom.Point(114, 108), new Phaser.Geom.Point(96, 118)],
      true,
    );
    g.fillStyle(0x2c5da8, 1).fillPoints(
      [new Phaser.Geom.Point(6, 56), new Phaser.Geom.Point(56, 6), new Phaser.Geom.Point(124, 6), new Phaser.Geom.Point(116, 48), new Phaser.Geom.Point(96, 56)],
      true,
    );
    g.fillStyle(0x234a8a, 1).fillPoints(
      [new Phaser.Geom.Point(6, 56), new Phaser.Geom.Point(56, 6), new Phaser.Geom.Point(66, 6), new Phaser.Geom.Point(20, 56)],
      true,
    );
    g.fillStyle(0x6b431d, 1).fillRect(40, 78, 28, 40);
    g.fillStyle(0xffd54a, 1).fillCircle(60, 98, 2);
    g.fillStyle(0xffe066, 1).fillCircle(84, 74, 8);
    this.done(g, 'shop', 128, 120);
  }

  private makeHireHut(g: Gfx): void {
    g.fillStyle(0x56c271, 1).fillTriangle(6, 118, 64, 10, 122, 118);
    g.fillStyle(0x3e9d57, 1).fillTriangle(64, 10, 122, 118, 80, 118);
    g.fillStyle(0xffffff, 0.85).fillTriangle(64, 10, 50, 40, 78, 40);
    g.fillStyle(0x2a2a2a, 1).fillTriangle(64, 56, 42, 118, 86, 118);
    g.fillStyle(0xffd54a, 1).fillRect(60, 2, 8, 12);
    this.done(g, 'hire_hut', 128, 120);
  }

  private makeStorage(g: Gfx): void {
    const crate = (x: number, y: number, w: number, h: number): void => {
      g.fillStyle(0xc88a46, 1).fillRect(x, y, w, h);
      g.lineStyle(2, 0x8f5a28, 1).strokeRect(x, y, w, h).lineBetween(x, y, x + w, y + h).lineBetween(x + w, y, x, y + h);
    };
    crate(4, 38, 36, 32);
    crate(40, 38, 36, 32);
    crate(20, 10, 36, 30);
    g.fillStyle(0x6b3f1a, 1).fillCircle(32, 8, 6).fillCircle(44, 12, 6);
    this.done(g, 'storage', 80, 72);
  }

  private makeRock(g: Gfx): void {
    g.fillStyle(0x9aa3ab, 1).fillPoints(
      [new Phaser.Geom.Point(2, 34), new Phaser.Geom.Point(10, 12), new Phaser.Geom.Point(28, 4), new Phaser.Geom.Point(44, 18), new Phaser.Geom.Point(46, 34)],
      true,
    );
    g.fillStyle(0xc4cbd1, 1).fillPoints(
      [new Phaser.Geom.Point(10, 12), new Phaser.Geom.Point(28, 4), new Phaser.Geom.Point(30, 16), new Phaser.Geom.Point(14, 22)],
      true,
    );
    this.done(g, 'rock', 48, 36);
  }

  private makePier(g: Gfx): void {
    g.fillStyle(0x9b6a34, 1).fillRect(10, 0, 100, 160);
    g.lineStyle(2, 0x6b431d, 1);
    for (let y = 10; y < 160; y += 16) g.lineBetween(10, y, 110, y);
    g.fillStyle(0x6b431d, 1).fillRect(6, 0, 6, 160).fillRect(108, 0, 6, 160);
    this.done(g, 'pier', 120, 160);
  }

  private makeBoat(g: Gfx): void {
    g.fillStyle(0x8a5a2b, 1).fillPoints(
      [new Phaser.Geom.Point(6, 62), new Phaser.Geom.Point(144, 62), new Phaser.Geom.Point(122, 96), new Phaser.Geom.Point(30, 96)],
      true,
    );
    g.fillStyle(0xb67c3f, 1).fillPoints(
      [new Phaser.Geom.Point(6, 62), new Phaser.Geom.Point(144, 62), new Phaser.Geom.Point(138, 72), new Phaser.Geom.Point(12, 72)],
      true,
    );
    g.fillStyle(0x6b431d, 1).fillRect(72, 8, 5, 56);
    g.fillStyle(0xffffff, 1).fillTriangle(79, 10, 79, 58, 122, 58);
    g.fillStyle(0xe8453c, 1).fillTriangle(70, 14, 70, 58, 36, 58);
    this.done(g, 'boat', 150, 100);
  }
}
