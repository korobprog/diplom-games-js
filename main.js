/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/js/utils.js
/* eslint-disable max-len */
function calcTileType(index, boardSize) {
  if (index === 0) {
    return 'top-left';
  }
  if (index === boardSize - 1) {
    return 'top-right';
  }
  if (index > 0 && index < boardSize - 1) {
    return 'top';
  }
  if (index === boardSize * (boardSize - 1)) {
    return 'bottom-left';
  }
  if (index === boardSize * boardSize - 1) {
    return 'bottom-right';
  }
  if (index > boardSize * (boardSize - 1) && index < boardSize * boardSize - 1) {
    return 'bottom';
  }
  if (index % boardSize === 0) {
    return 'left';
  }
  if ((index + 1) % boardSize === 0) {
    return 'right';
  }
  return 'center';
}
function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }
  if (health < 50) {
    return 'normal';
  }
  return 'high';
}
function getInfo(character) {
  const levelInfo = String.fromCodePoint(0x1F396) + character.level;
  const attackInfo = String.fromCodePoint(0x2694) + character.attack;
  const defenceInfo = String.fromCodePoint(0x1F6E1) + character.defence;
  const healthInfo = String.fromCodePoint(0x2764) + character.health;
  return `${levelInfo} ${attackInfo} ${defenceInfo} ${healthInfo}`;
}
function getCoordinates(index, square) {
  const coordinates = {
    x: null,
    y: null
  };
  if (index === 0) {
    coordinates.x = 1;
    coordinates.y = 1;
  }
  if (index > 0 && index < square) {
    coordinates.x = 1;
    coordinates.y = index + 1;
  }
  if (index >= square) {
    if (index % square === 0) {
      coordinates.x = Math.ceil((index + 1) / square);
      coordinates.y = 1;
    } else {
      coordinates.x = Math.ceil(index / square);
      coordinates.y = index % square + 1;
    }
  }
  return coordinates;
}
function getIndex(coordinates, square) {
  return (coordinates.x - 1) * square - 1 + coordinates.y;
}
function randomIndex(selectedCoordinates, distance, square) {
  const coordinates = {
    x: null,
    y: null
  };
  let differenceX;
  let differenceY;
  do {
    coordinates.x = Math.floor(Math.random() * (distance * 2 + 1)) + (selectedCoordinates.x - distance);
    coordinates.y = Math.floor(Math.random() * (distance * 2 + 1)) + (selectedCoordinates.y - distance);
    differenceX = Math.abs(coordinates.x - selectedCoordinates.x);
    differenceY = Math.abs(coordinates.y - selectedCoordinates.y);
  } while (coordinates.x === selectedCoordinates.x && coordinates.y === selectedCoordinates.y || coordinates.x > square || coordinates.y > square || coordinates.x <= 0 || coordinates.y <= 0 || differenceX > distance || differenceY > distance || differenceX !== differenceY && differenceX !== 0 && differenceY !== 0);
  return getIndex(coordinates, square);
}
;// CONCATENATED MODULE: ./src/js/GamePlay.js

class GamePlay {
  constructor() {
    this.boardSize = 8;
    this.container = null;
    this.boardEl = null;
    this.cells = [];
    this.cellClickListeners = [];
    this.cellEnterListeners = [];
    this.cellLeaveListeners = [];
    this.newGameListeners = [];
    this.saveGameListeners = [];
    this.loadGameListeners = [];
  }
  bindToDOM(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('container is not HTMLElement');
    }
    this.container = container;
  }

  /**
    * Draws boardEl with specific theme
    *
    * @param theme
    */
  drawUi(theme) {
    this.checkBinding();
    this.container.innerHTML = `
      <div class="controls">
        <button data-id="action-restart" class="btn">New Game</button>
        <button data-id="action-save" class="btn">Save Game</button>
        <button data-id="action-load" class="btn">Load Game</button>
      </div>
      <div class="board-container">
        <div data-id="board" class="board"></div>
      </div>
    `;
    this.newGameEl = this.container.querySelector('[data-id=action-restart]');
    this.saveGameEl = this.container.querySelector('[data-id=action-save]');
    this.loadGameEl = this.container.querySelector('[data-id=action-load]');
    this.newGameEl.addEventListener('click', event => this.onNewGameClick(event));
    this.saveGameEl.addEventListener('click', event => this.onSaveGameClick(event));
    this.loadGameEl.addEventListener('click', event => this.onLoadGameClick(event));
    this.boardEl = this.container.querySelector('[data-id=board]');
    this.boardEl.classList.add(theme);
    for (let i = 0; i < this.boardSize ** 2; i += 1) {
      const cellEl = document.createElement('div');
      cellEl.classList.add('cell', 'map-tile', `map-tile-${calcTileType(i, this.boardSize)}`);
      cellEl.addEventListener('mouseenter', event => this.onCellEnter(event));
      cellEl.addEventListener('mouseleave', event => this.onCellLeave(event));
      cellEl.addEventListener('click', event => this.onCellClick(event));
      this.boardEl.appendChild(cellEl);
    }
    this.cells = Array.from(this.boardEl.children);
  }

  /**
    * Draws positions (with chars) on boardEl
    *
    * @param positions array of PositionedCharacter objects
    */
  redrawPositions(positions) {
    for (const cell of this.cells) {
      cell.innerHTML = '';
    }
    for (const position of positions) {
      const cellEl = this.boardEl.children[position.position];
      const charEl = document.createElement('div');
      charEl.classList.add('character', position.character.type);
      const healthEl = document.createElement('div');
      healthEl.classList.add('health-level');
      const healthIndicatorEl = document.createElement('div');
      healthIndicatorEl.classList.add('health-level-indicator', `health-level-indicator-${calcHealthLevel(position.character.health)}`);
      healthIndicatorEl.style.width = `${position.character.health}%`;
      healthEl.appendChild(healthIndicatorEl);
      charEl.appendChild(healthEl);
      cellEl.appendChild(charEl);
    }
  }

  /**
    * Add listener to mouse enter for cell
    *
    * @param callback
    */
  addCellEnterListener(callback) {
    this.cellEnterListeners.push(callback);
  }

  /**
    * Add listener to mouse leave for cell
    *
    * @param callback
    */
  addCellLeaveListener(callback) {
    this.cellLeaveListeners.push(callback);
  }

  /**
    * Add listener to mouse click for cell
    *
    * @param callback
    */
  addCellClickListener(callback) {
    this.cellClickListeners.push(callback);
  }

  /**
    * Add listener to "New Game" button click
    *
    * @param callback
    */
  addNewGameListener(callback) {
    this.newGameListeners.push(callback);
  }

  /**
    * Add listener to "Save Game" button click
    *
    * @param callback
    */
  addSaveGameListener(callback) {
    this.saveGameListeners.push(callback);
  }

  /**
    * Add listener to "Load Game" button click
    *
    * @param callback
    */
  addLoadGameListener(callback) {
    this.loadGameListeners.push(callback);
  }
  onCellEnter(event) {
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    this.cellEnterListeners.forEach(o => o.call(null, index));
  }
  onCellLeave(event) {
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    this.cellLeaveListeners.forEach(o => o.call(null, index));
  }
  onCellClick(event) {
    const index = this.cells.indexOf(event.currentTarget);
    this.cellClickListeners.forEach(o => o.call(null, index));
  }
  onNewGameClick(event) {
    event.preventDefault();
    this.newGameListeners.forEach(o => o.call(null));
  }
  onSaveGameClick(event) {
    event.preventDefault();
    this.saveGameListeners.forEach(o => o.call(null));
  }
  onLoadGameClick(event) {
    event.preventDefault();
    this.loadGameListeners.forEach(o => o.call(null));
  }
  static showError(message) {
    alert(message); // eslint-disable-line
  }

  static showMessage(message) {
    alert(message); // eslint-disable-line
  }

  selectCell(index) {
    let color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'yellow';
    this.cells[index].classList.add('selected', `selected-${color}`);
  }
  deselectCell(index) {
    if (typeof index === 'number') {
      const cell = this.cells[index];
      cell.classList.remove(...Array.from(cell.classList).filter(o => o.startsWith('selected')));
    }
  }
  showCellTooltip(message, index) {
    this.cells[index].title = message;
  }
  hideCellTooltip(index) {
    this.cells[index].title = '';
  }
  showDamage(index, damage) {
    return new Promise(resolve => {
      const cell = this.cells[index];
      const damageEl = document.createElement('span');
      damageEl.textContent = damage;
      damageEl.classList.add('damage');
      cell.appendChild(damageEl);
      damageEl.addEventListener('animationend', () => {
        cell.removeChild(damageEl);
        resolve();
      });
    });
  }
  setCursor(cursor) {
    this.boardEl.style.cursor = cursor;
  }
  checkBinding() {
    if (this.container === null) {
      throw new Error('GamePlay not bind to DOM');
    }
  }
}
;// CONCATENATED MODULE: ./src/js/themes.js
const themes = {
  1: 'prairie',
  2: 'desert',
  3: 'arctic',
  4: 'mountain'
};
/* harmony default export */ const js_themes = (themes);
;// CONCATENATED MODULE: ./src/js/cursors.js
const cursors = {
  auto: 'auto',
  pointer: 'pointer',
  crosshair: 'crosshair',
  notallowed: 'not-allowed'
};
/* harmony default export */ const js_cursors = (cursors);
;// CONCATENATED MODULE: ./src/js/GameState.js
class GameState {
  constructor() {
    this.level = 1;
    this.charactersCount = 2;
    this.positions = [];
    this.currentMove = 'player';
    this.selectedCell = null;
    this.selectedCellIndex = null;
    this.selectedCharacter = null;
    this.selectedCellCoordinates = null;
    this.isAvailableToMove = false;
    this.isAvailableToAttack = false;
    this.playerTypes = ['bowman', 'swordsman', 'magician'];
    this.enemyTypes = ['vampire', 'undead', 'daemon'];
    this.playerTeam = [];
    this.enemyTeam = [];
  }
}
;// CONCATENATED MODULE: ./src/js/Team.js
/**
 * Класс, представляющий персонажей команды
 *
 * @todo Самостоятельно продумайте хранение персонажей в классе
 * Например
 * @example
 * ```js
 * const characters = [new Swordsman(2), new Bowman(1)]
 * const team = new Team(characters);
 *
 * team.characters // [swordsman, bowman]
 * ```
 * */
class Team {
  constructor() {
    let characters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    this.characters = characters;
  }
}
;// CONCATENATED MODULE: ./src/js/generators.js


/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
function* characterGenerator(allowedTypes, maxLevel) {
  const idx = Math.floor(Math.random() * allowedTypes.length);
  const level = Math.floor(Math.random() * maxLevel + 1);
  const character = new allowedTypes[idx](1);
  for (let i = 1; i < level; i += 1) {
    character.levelUp();
  }
  yield character;
}
function generateTeam(allowedTypes, maxLevel, characterCount) {
  const characters = [];
  for (let i = 1; i <= characterCount; i += 1) {
    characters.push(characterGenerator(allowedTypes, maxLevel).next().value);
  }
  return new Team(characters);
}
function* genPosLeft(characterCount) {
  const left = [];
  const positions = new Set();
  for (let i = 0; i < 8 ** 2; i += 1) {
    if (i === 0 || i === 1 || i % 8 === 0 || i % 8 === 1) {
      left.push(i);
    }
  }
  while (positions.size < characterCount) {
    positions.add(left[Math.floor(Math.random() * left.length)]);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const pos of positions) {
    yield pos;
  }
}
function* genPosRight(characterCount) {
  const right = [];
  const positions = new Set();
  for (let i = 0; i < 8 ** 2; i += 1) {
    if (i === 8 - 2 || i === 8 - 1 || (i + 2) % 8 === 0 || (i + 1) % 8 === 0) {
      right.push(i);
    }
  }
  while (positions.size < characterCount) {
    positions.add(right[Math.floor(Math.random() * right.length)]);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const pos of positions) {
    yield pos;
  }
}
;// CONCATENATED MODULE: ./src/js/Character.js
class Character {
  constructor(level) {
    let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'generic';
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    if (new.target.name === 'Character') {
      throw new Error('Нельзя создавать объекты через new Character()');
    }
  }
  levelUp() {
    this.level += 1;
    const life = 1.8 - (1 - this.health / 100);
    this.attack = Math.floor(Math.max(this.attack, this.attack * life));
    this.defence = Math.floor(Math.max(this.defence, this.defence * life));
    this.health += 80;
    if (this.health > 100) {
      this.health = 100;
    }
  }
}
;// CONCATENATED MODULE: ./src/js/PositionedCharacter.js

class PositionedCharacter {
  constructor(character, position) {
    if (!(character instanceof Character)) {
      throw new Error('character must be instance of Character or its children');
    }
    if (typeof position !== 'number') {
      throw new Error('position must be a number');
    }
    this.character = character;
    this.position = position;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Bowman.js

class Bowman extends Character {
  constructor(level) {
    super(level, 'bowman');
    this.attack = 25;
    this.defence = 25;
    this.moveDist = 2;
    this.attackDist = 2;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Daemon.js

class Daemon extends Character {
  constructor(level) {
    super(level, 'daemon');
    this.attack = 10;
    this.defence = 40;
    this.moveDist = 1;
    this.attackDist = 4;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Magician.js

class Magician extends Character {
  constructor(level) {
    super(level, 'magician');
    this.attack = 10;
    this.defence = 40;
    this.moveDist = 1;
    this.attackDist = 4;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Swordsman.js

class Swordsman extends Character {
  constructor(level) {
    super(level, 'swordsman');
    this.attack = 40;
    this.defence = 10;
    this.moveDist = 4;
    this.attackDist = 1;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Undead.js

class Undead extends Character {
  constructor(level) {
    super(level, 'undead');
    this.attack = 40;
    this.defence = 10;
    this.moveDist = 4;
    this.attackDist = 1;
  }
}
;// CONCATENATED MODULE: ./src/js/characters/Vampire.js

class Vampire extends Character {
  constructor(level) {
    super(level, 'vampire');
    this.attack = 25;
    this.defence = 25;
    this.moveDist = 2;
    this.attackDist = 2;
  }
}
;// CONCATENATED MODULE: ./src/js/GameController.js
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-syntax */















class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.playerTypes = [Bowman, Swordsman, Magician];
    this.enemyTypes = [Vampire, Undead, Daemon];
    this.currentCellIdx = null;
  }
  init() {
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    this.start();
  }

  // НАЧАЛО ИГРЫ
  start() {
    this.createTeams();
    this.drawBoard();
  }
  onNewGameClick() {
    this.blockBoard();
    this.gameState = new GameState();
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.currentCellIdx = null;
    this.createTeams();
    this.drawBoard();
  }
  onSaveGameClick() {
    this.stateService.save(this.gameState);
  }
  onLoadGameClick() {
    if (this.stateService.storage.length > 0 /* сохраненная игра */) {
      const loadedGame = this.stateService.load();
      this.gameState = new GameState();
      this.gameState.level = loadedGame.level;
      this.gameState.charactersCount = loadedGame.charactersCount;
      this.gameState.positions = loadedGame.positions;
      this.gameState.currentMove = loadedGame.currentMove;
      this.gameState.selectedCell = loadedGame.selectedCell;
      this.gameState.selectedCellIndex = loadedGame.selectedCellIndex;
      this.gameState.selectedCharacter = loadedGame.selectedCharacter;
      this.gameState.selectedCellCoordinates = loadedGame.selectedCellCoordinates;
      this.gameState.isAvailableToMove = loadedGame.isAvailableToMove;
      this.gameState.isAvailableToAttack = loadedGame.isAvailableToAttack;
      const playerChars = [];
      const enemyChars = [];
      this.gameState.positions.forEach(pos => {
        Object.setPrototypeOf(pos.character, Character.prototype);
        if (this.gameState.playerTypes.some(item => item === pos.character.type)) {
          playerChars.push(pos.character);
        }
        if (this.gameState.enemyTypes.some(item => item === pos.character.type)) {
          enemyChars.push(pos.character);
        }
      });
      this.gameState.playerTeam = new Team(playerChars);
      this.gameState.enemyTeam = new Team(enemyChars);
      this.drawBoard();
    }
  }

  // КЛИК ПО КЛЕТКЕ
  async onCellClick(index) {
    const currentCell = this.gamePlay.cells[index];
    const currentCellWithChar = currentCell.firstChild;
    let isEnemy;
    let isAvailableToMove;
    let isAvailableToAttack;
    if (currentCellWithChar) {
      isEnemy = this.gameState.enemyTeam.characters.some(item => currentCellWithChar.classList.contains(item.type));
    }
    if (this.gameState.selectedCell) {
      isAvailableToMove = this.availableTo(index, this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.moveDist);
      isAvailableToAttack = this.availableTo(index, this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.attackDist);
    }

    // выбрать персонажа (есть персонаж в клетке && персонаж свой)
    if (currentCellWithChar && !isEnemy) {
      this.gamePlay.deselectCell(this.gameState.selectedCellIndex);
      this.gamePlay.selectCell(index);
      this.gameState.selectedCell = currentCell;
      this.gameState.selectedCellIndex = index;
      this.gameState.selectedCharacter = this.findCharacter(index);
      this.gameState.selectedCellCoordinates = getCoordinates(index, this.gamePlay.boardSize);
    }

    // переместить персонажа в пустую клетку (в клетке нет персонажа && клетка в зоне хода)
    if (!currentCellWithChar && isAvailableToMove) {
      this.gamePlay.deselectCell(this.gameState.selectedCellIndex);
      this.gamePlay.deselectCell(this.currentCellIdx);
      this.moveToAnEmptyCell(index);
      if (this.gameState.currentMove === 'player') {
        await this.enemyMove();
      }
    }

    // атака (есть персонаж в клетке && персонаж противника)
    if (currentCellWithChar && isEnemy) {
      if (isAvailableToAttack) {
        this.gamePlay.deselectCell(this.gameState.selectedCellIndex);
        this.gamePlay.deselectCell(this.currentCellIdx);
        const enemyCharacter = this.findCharacter(index);
        await this.attack(this.gameState.selectedCharacter, enemyCharacter, index);
        if (this.gameState.enemyTeam.characters.length === 0) {
          this.gameLevelUp();
          return;
        }
        if (this.gameState.currentMove === 'player') {
          await this.enemyMove();
        }
      } else {
        GamePlay.showError('Этот игрок противника недоступен для атаки!');
      }
    }
  }

  // НАВЕДЕНИЕ НА КЛЕТКУ
  onCellEnter(index) {
    if (typeof this.currentCellIdx === 'number' && !this.gamePlay.cells[this.currentCellIdx].classList.contains('selected-yellow')) {
      this.gamePlay.deselectCell(this.currentCellIdx);
    }
    const currentCell = this.gamePlay.cells[index];
    const currentCellWithChar = currentCell.firstChild;
    let isEnemy;
    let isAvailableToMove;
    let isAvailableToAttack;

    // показать инфу (есть персонаж в клетке)
    if (currentCellWithChar) {
      this.gamePlay.setCursor(js_cursors.pointer);
      this.gamePlay.showCellTooltip(getInfo(this.findCharacter(index)), index);
      isEnemy = this.gameState.enemyTypes.some(item => currentCellWithChar.classList.contains(item));
    }
    if (this.gameState.selectedCell) {
      isAvailableToMove = this.availableTo(index, this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.moveDist);
      isAvailableToAttack = this.availableTo(index, this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.attackDist);
    }

    // если есть выделенная клетка
    if (this.gameState.selectedCell) {
      // если наведенная клетка в зоне хода
      if (isAvailableToMove) {
        // если наведенная клетка пустая
        if (!currentCellWithChar) {
          this.gamePlay.setCursor(js_cursors.pointer);
          this.gamePlay.selectCell(index, 'green');
        }
        // если наведенная клетка НЕ в зоне хода
      } else {
        this.gamePlay.setCursor(js_cursors.notallowed);
      }

      // если в клетке персонаж противника
      if (currentCellWithChar && isEnemy) {
        // если в зоне атаки
        if (isAvailableToAttack) {
          this.gamePlay.setCursor(js_cursors.crosshair);
          this.gamePlay.selectCell(index, 'red');
        } else {
          this.gamePlay.setCursor(js_cursors.notallowed);
        }
      }
    }

    // если в наведенной клетке есть персонаж и он свой
    if (currentCellWithChar && !isEnemy) {
      this.gamePlay.setCursor(js_cursors.pointer);
    }
    this.currentCellIdx = index;
  }

  // ПОКИНУТЬ КЛЕТКУ
  onCellLeave(index) {
    this.gamePlay.setCursor(js_cursors.auto);
    this.gamePlay.hideCellTooltip(index);
  }

  // ПЕРЕХОД НА СЛЕД. УРОВЕНЬ
  gameLevelUp() {
    if (this.gameState.currentMove === 'enemy') {
      // Проигрыш
      // eslint-disable-next-line
      alert('Вы проиграли.\nЧтобы начать новую игру нажмите "New game".');
      this.blockBoard();
      return;
    }
    this.gameState.level += 1;
    if (this.gameState.level > 4) {
      // Победа
      this.blockBoard();
      // eslint-disable no-alert
      alert('Поздравляю! Вы победили!');
    } else {
      // Переход на следующий уровень
      /* eslint-disable no-alert */
      alert(`Уровень пройден! Переход на уровень ${this.gameState.level}`);
      this.gameState.playerTeam.characters.forEach(char => char.levelUp());
      this.gameState.charactersCount += 1;
      this.gameState.positions = [];
      this.createTeams();
      this.drawBoard();
    }
  }

  // СОЗДАНИЕ КОМАНД
  createTeams() {
    if (this.gameState.level === 1) {
      this.gameState.playerTeam = generateTeam(this.playerTypes, this.gameState.level, this.gameState.charactersCount);
      this.gameState.enemyTeam = generateTeam(this.enemyTypes, this.gameState.level, this.gameState.charactersCount);
    } else {
      const countForPlayer = this.numberOfCharactersToAdd(this.gameState.playerTeam.characters);
      const countForEnemy = this.numberOfCharactersToAdd(this.gameState.enemyTeam.characters);
      const playerChars = [];
      const enemyChars = [];
      for (let i = 1; i <= countForPlayer; i += 1) {
        playerChars.push(characterGenerator(this.playerTypes, this.gameState.level).next().value);
      }
      for (let i = 1; i <= countForEnemy; i += 1) {
        enemyChars.push(characterGenerator(this.enemyTypes, this.gameState.level).next().value);
      }
      playerChars.forEach(item => this.gameState.playerTeam.characters.push(item));
      enemyChars.forEach(item => this.gameState.enemyTeam.characters.push(item));
    }
    const posLeft = genPosLeft(this.gameState.charactersCount);
    const posRight = genPosRight(this.gameState.charactersCount);
    this.gameState.playerTeam.characters.forEach(item => {
      this.gameState.positions.push(new PositionedCharacter(item, posLeft.next().value));
    });
    this.gameState.enemyTeam.characters.forEach(item => {
      this.gameState.positions.push(new PositionedCharacter(item, posRight.next().value));
    });
  }

  // ОПРЕДЕЛЕНИЕ СКОЛЬКО ПЕРСОНАЖЕЙ НУЖНО ДОБАВИТЬ НА СЛЕД. УРОВНЕ
  numberOfCharactersToAdd(team) {
    return this.gameState.charactersCount - team.length;
  }

  // ПЕРЕМЕЩЕНИЕ ПЕРСОНАЖА В ПУСТУЮ КЛЕТКУ
  moveToAnEmptyCell(index) {
    // находим индекс выделенного персонажа в массиве this.gameState.positions
    const idx = this.gameState.positions.findIndex(item => item.position === this.gameState.selectedCellIndex);
    this.gameState.positions[idx].position = index;
    this.gamePlay.redrawPositions(this.gameState.positions);
    this.clearSelectedCell();
  }

  // АТАКА
  async attack(attacker, target, targetIndex) {
    const damage = Math.floor(Math.max(attacker.attack - target.defence, attacker.attack * 0.2));
    // eslint-disable-next-line no-param-reassign
    target.health -= damage;
    await this.gamePlay.showDamage(targetIndex, damage);
    this.checkDeath(target);
    this.gamePlay.redrawPositions(this.gameState.positions);
    this.clearSelectedCell();
  }

  // ПРОВЕРКА НА СМЕРТЬ
  checkDeath(character) {
    if (character.health <= 0) {
      let idx = this.gameState.positions.findIndex(item => item.character.health <= 0);
      this.gameState.positions.splice(idx, 1);
      idx = this.gameState.enemyTeam.characters.findIndex(item => item.health <= 0);
      this.gameState.enemyTeam.characters.splice(idx, 1);
    }
  }

  // НАЙТИ ПЕРСОНАЖ В ПОЗИЦИЯХ
  findCharacter(index) {
    const findIdx = this.gameState.positions.findIndex(item => item.position === index);
    return this.gameState.positions[findIdx].character;
  }

  // ОЧИСТКА ВЫДЕЛЕННОЙ КЛЕТКИ
  clearSelectedCell() {
    this.gameState.selectedCell = null;
    this.gameState.selectedCellIndex = null;
    this.gameState.selectedCharacter = null;
    this.gameState.selectedCellCoordinates = null;
    this.gameState.isAvailableToMove = false;
    this.gameState.isAvailableToAttack = false;
  }

  // ОТРИСОВКА ПОЛЯ
  drawBoard() {
    this.gamePlay.drawUi(js_themes[this.gameState.level]);
    this.gamePlay.redrawPositions(this.gameState.positions);
  }

  // БЛОКИРОВКА ПОЛЯ
  blockBoard() {
    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];
    this.gamePlay.setCursor(js_cursors.auto);
  }

  // ХОД ПРОТИВНИКА
  async enemyMove() {
    this.gameState.currentMove = 'enemy';
    const {
      playerTeam
    } = this.gameState;
    const {
      enemyTeam
    } = this.gameState;
    let isAvailableToAttack;
    const arrOfEnemyPos = [];
    // меняем местами команды, теперь противник становится игроком и наоборот
    this.gameState.playerTeam = enemyTeam;
    this.gameState.enemyTeam = playerTeam;

    // перебираем индексы персонажей в позициях; если персонаж противника, то переводим его индекс в координаты и добавляем в массив
    this.gameState.positions.forEach(item => {
      if (this.gameState.enemyTeam.characters.some(char => char.type === item.character.type)) {
        arrOfEnemyPos.push(item.position);
      }
    });

    // перебираем персонажей в команде для определения возможности атаки
    for (const char of this.gameState.playerTeam.characters) {
      // если ход противника (компьютера)
      if (this.gameState.currentMove === 'enemy') {
        // то находим индекс персонажа в позициях
        const idx = this.gameState.positions.findIndex(pos => pos.character === char);
        // выделяем его
        await this.onCellClick(this.gameState.positions[idx].position);
        // перебираем позиции противника
        for (const pos of arrOfEnemyPos) {
          // определяем возможна ли атака
          isAvailableToAttack = this.availableTo(pos, this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.attackDist);
          // если возможна, то атакуем и передаем ход
          if (isAvailableToAttack) {
            await this.onCellClick(pos);
            this.gameState.currentMove = 'player';
            this.gameState.playerTeam = playerTeam;
            this.gameState.enemyTeam = enemyTeam;
            break;
          }
        }
      }
    }
    // если атака невозможна, то перемещаем последнего из предыдущей итерации персонажа в пустую клетку
    if (this.gameState.currentMove === 'enemy') {
      await this.onCellClick(randomIndex(this.gameState.selectedCellCoordinates, this.gameState.selectedCharacter.moveDist, this.gamePlay.boardSize));
      this.gameState.currentMove = 'player';
      this.gameState.playerTeam = playerTeam;
      this.gameState.enemyTeam = enemyTeam;
    }
  }

  // ДОСТУПЕН ЛИ  ИНДЕКС ДЛЯ ХОДА/АТАКИ
  // eslint-disable-next-line consistent-return
  availableTo(index, selectedCoordinates, distance) {
    const currentCoordinates = getCoordinates(index, this.gamePlay.boardSize);
    const differenceX = Math.abs(currentCoordinates.x - selectedCoordinates.x);
    const differenceY = Math.abs(currentCoordinates.y - selectedCoordinates.y);
    if (differenceX <= distance && differenceY <= distance && (differenceX === differenceY || differenceX === 0 || differenceY === 0)) {
      return true;
    }
  }
}
;// CONCATENATED MODULE: ./src/js/GameStateService.js
class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }
  save(state) {
    this.storage.setItem('state', JSON.stringify(state));
  }
  load() {
    try {
      return JSON.parse(this.storage.getItem('state'));
    } catch (e) {
      throw new Error('Invalid state');
    }
  }
}
;// CONCATENATED MODULE: ./src/js/app.js
/**
 * Entry point of app: don't change this
 */



const gamePlay = new GamePlay();
// eslint-disable-next-line
gamePlay.bindToDOM(document.querySelector('#game-container'));
// eslint-disable-next-line
const stateService = new GameStateService(localStorage);
const gameCtrl = new GameController(gamePlay, stateService);
gameCtrl.init();
;// CONCATENATED MODULE: ./src/index.js



// Точка входа webpack
// Не пишите код в данном файле
/******/ })()
;