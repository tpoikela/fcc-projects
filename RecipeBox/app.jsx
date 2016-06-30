
// Set to 1 for some debug information
var $DEBUG = 0;

/** Used for parsing the textarea for ingredients. Items can be newline or
 * comma-separated.*/
var IngredientsParser = function() {

    this.getListOfIngredients = function(ings) {
        var list = ings.split(/\n/);
        var result = [];
        for (var i = 0; i < list.length; i++) {
            var newList = list[i].split(/,/);
            for (var j = 0; j < newList.length; j++) {
                result.push(newList[j]);
            }
        }
        return result;
    };

};

/* Models a recipe which has a name and a list of ingredients.*/
var Recipe = React.createClass({

    getInitialState: function() {
        return {hideIngredients: true};
    },

    /** Hides/shows the ingredients of the recipe.*/
    onClickRecipeName: function(evt) {
        this.setState({hideIngredients: !this.state.hideIngredients});
    },

    /** Set the edited recipe. */
    onClickEdit: function(evt) {
        this.props.setRecipeForEdit(this.props.recipe);
    },

    /** Set the deleted recipe for the parent component.*/
    onClickDelete: function(evt) {
        debug("Setting recipe ID " + this.props.recipe.id + " for deletion.");
        this.props.setRecipeForDelete(this.props.recipe);
    },

    render: function() {
        var ings = this.props.recipe.ingredients;
        var ingredientClass = "recipe-ingredients";
        if (this.state.hideIngredients) {
            ingredientClass += " recipe-hidden";
        }
        return (
            <div className="recipe">
                <div className="recipe-name" onClick={this.onClickRecipeName}>
                    <p className="text-primary">{this.props.recipe.name}</p>
                </div>
                <div className={ingredientClass}>
                    <IngredientsList ingredients={ings} />
                    <button
                        className="recipe-edit-button btn btn-info"
                        onClick={this.onClickEdit}
                        data-toggle="modal"
                        data-target="#editRecipeModal">
                        Edit
                    </button>
                    <button
                        className="recipe-delete-button btn btn-danger"
                        onClick={this.onClickDelete}
                        data-toggle="modal"
                        data-target="#deleteRecipeModal">
                        Delete
                    </button>
                </div>
            </div>
        );
    }

});

/** Handles parsing and rendering of ingredients list.*/
var IngredientsList = React.createClass({

    getIngredientsAsList: function(ings) {
        var parser = new IngredientsParser();
        return parser.getListOfIngredients(ings);
    },

    render: function() {
        var ingsList = this.getIngredientsAsList(this.props.ingredients);
        return (
            <div className="ingredients-div">
                <ul className="ingredients-list">
                {ingsList.map( function(ing, index) {
                    return (<li className="ingredient" key={index}>{ing}</li>);
                })
                }
                </ul>
            </div>
        );
    }

});

var RecipeList = React.createClass({

    render: function() {
        var recipes = this.props.recipes;
        var setRecipeForEdit = this.props.setRecipeForEdit;
        var setRecipeForDelete = this.props.setRecipeForDelete;
        var recipeElements = "";
        if (recipes.length === 0) {
            recipeElements = <p>No recipes added yet. Start by clicking 'Add Recipe' button.</p>;
        }
        else {
            recipeElements = recipes.map(
            function(obj, index) {
            return (<Recipe setRecipeForDelete={setRecipeForDelete} setRecipeForEdit={setRecipeForEdit} key={index} recipe={obj} />);
            }
            );
        }
        return (
            <div id="recipe-list">
                {recipeElements}
            </div>
        );
    }

});

/* Shows Yes/No modal pop-up to delete a recipe. */
var RecipeDeleteBox = React.createClass({

    onConfirmDelete: function(evt) {
        this.props.onConfirmDelete(evt);
    },

    render: function() {
        return (
            <div className="modal fade" id="deleteRecipeModal" tabIndex="-1" role="dialog" aria-labelledby="delete-recipe-modal-label" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="delete-recipe-modal-label">Delete Recipe</h4>
                        </div>
                        <div className="modal-body">
                            <p>Really delete the recipe?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">No</button>
                            <button type="button" onClick={this.onConfirmDelete} className="btn btn-primary" data-dismiss="modal">Yes</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

/** This is a modal which is invoked when "Edit" button in any of the recipes is
 *  pushed. The component must received existing name and ingredients from the
 *  recipe.
 */
var RecipeEditBox = React.createClass({

    getInitialState: function() {
        return {
            recipeName: "",
            recipeIngredients: ""
        };
    },

    onNameChange: function(evt) {
        this.setState({recipeName: evt.target.value});
    },

    onIngredientsChange: function(evt) {
        this.setState({recipeIngredients: evt.target.value});
    },

    onAddRecipe: function(evt) {
        var name = this.state.recipeName;
        var ings = this.state.recipeIngredients;
        debug("onAddRecipe with " + name + " and " + ings);

        // Call parent callback to add recipe
        this.props.onClickEditRecipe(evt, name, ings);
    },

    /** Should be called by a recipe to set the values.*/
    setValues: function(recipe) {
        this.setState({
            recipeName: recipe.name,
            recipeIngredients: recipe.ingredients
        });
    },

    render: function() {
        return (
            <div className="modal fade" id="editRecipeModal" tabIndex="-1" role="dialog" aria-labelledby="edit-recipe-modal-label" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="edit-recipe-modal-label">Edit Recipe</h4>
                        </div>
                        <div className="modal-body">
                            <div>
                                <label>Name
                                    <input type="text" value={this.state.recipeName} onChange={this.onNameChange} />
                                </label>
                            </div>
                            <div>
                                <label>Ingredients
                                    <textarea rows="4" type="text" value={this.state.recipeIngredients} onChange={this.onIngredientsChange}></textarea>
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" onClick={this.onAddRecipe} className="btn btn-primary" data-dismiss="modal">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});


/** This is a modal component which handles adding of new recipes. It has
 * input fields for adding the recipe information, and "Add" button.*/
var RecipeAddBox = React.createClass({

    getInitialState: function() {
        return {
            recipeName: "",
            recipeIngredients: ""
        };
    },

    onNameChange: function(evt) {
        this.setState({recipeName: evt.target.value});
    },

    onIngredientsChange: function(evt) {
        this.setState({recipeIngredients: evt.target.value});
    },

    onAddRecipe: function(evt) {
        var name = this.state.recipeName;
        var ings = this.state.recipeIngredients;
        debug("onAddRecipe with " + name + " and " + ings);

        // Call parent callback to add recipe
        this.props.onClickAddRecipe(evt, name, ings);
        this.setState({recipeName: "", recipeIngredients: ""});
    },

    render: function() {
        return (
            <div className="modal fade" id="addRecipeModal" tabIndex="-1" role="dialog" aria-labelledby="add-recipe-modal-label" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" id="add-recipe-modal-label">Add Recipe</h4>
                        </div>
                        <div className="modal-body">
                            <div>
                                <label>Name<br/>
                                    <input type="text" value={this.state.recipeName} onChange={this.onNameChange} />
                                </label>
                            </div>
                            <div>
                            <label>Ingredients<br/>
                                <textarea rows="4" type="text" value={this.state.recipeIngredients} onChange={this.onIngredientsChange}></textarea>
                            </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" onClick={this.onAddRecipe} className="btn btn-primary" data-dismiss="modal">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});


var RecipeBox = React.createClass({

    recipeID: 0,

    getInitialState: function() {
        return {
            recipes: []
        };
    },

    /** Saves the recipes to local storage and updates state.*/
    setAndSaveState: function(recipes) {
        var dbObj = {recipes: recipes};
        var dbString = JSON.stringify(dbObj);
        localStorage.setItem("_tpoikela_recipes", dbString);
        this.setState({recipes: recipes});

    },

    onClickEditRecipe: function(evt, name, ings) {
        debug("<RecipeBox> onClickEditRecipe called");
        var id = this.editedRecipe.id;
        var currRecipes = this.state.recipes;
        var idFound = false;
        for (var i = 0; i < currRecipes.length; i++) {
            if (currRecipes[i].id === id) {
                currRecipes[i].name = name;
                currRecipes[i].ingredients = ings;
                idFound = true;
                break;
            }
        }

        if (!idFound) {
            console.error("onClickEditRecipe: No recipe ID " + id);
        }

        this.setAndSaveState(currRecipes);
    },

    onClickAddRecipe: function(evt, name, ings) {
        debug("<RecipeBox> onClickAddRecipe: " + name + " ingredients: " + ings);
        var currRecipes = this.state.recipes;
        currRecipes.push({name: name, ingredients: ings, id: this.recipeID});
        this.recipeID += 1;
        this.setAndSaveState(currRecipes);
    },

    setRecipeForEdit: function(recipe) {
        if (this.editModal !== null) {
            this.editModal.setValues(recipe);
        }
        this.editedRecipe = recipe;
    },

    setRecipeForDelete: function(recipe) {
        debug("Setting recipe ID " + recipe.id + " for deletion.");
        this.deleteRecipe = recipe;
    },

    onConfirmDelete: function(evt) {
        var id = this.deleteRecipe.id;
        var currRecipes = this.state.recipes;
        var idFound = false;
        for (var i = 0; i < currRecipes.length; i++) {
            if (currRecipes[i].id === id) {
                currRecipes.splice(i, 1);
                idFound = true;
                break;
            }
        }
        if (!idFound) {
            console.error("onConfirmDelete: No recipe ID " + id);
        }
        this.setAndSaveState(currRecipes);
    },

    /** Check here if local storage has been populated. Load it if necessary.*/
    componentWillMount: function() {
        var dbString = localStorage.getItem("_tpoikela_recipes");
        debug("localStorage dbString is " + dbString);

        try {
            var dbObj = JSON.parse(dbString);
            var recipes = dbObj.recipes;
            debug("willMount: recipes: " + recipes);
            if (recipes) {
                this.recipeID = this.getLastId(recipes) + 1;
                debug("Set last recipeID to " + this.recipeID);
                this.setState({recipes: recipes});
            }
        }
        catch (err) {
            console.error("Couldn't retrieve local storage: |" + err.message + "| Clearing it...");
            localStorage.clear();
            this.recipeID = 0;
        }

    },

    /** Finds the largest ID among recipes.*/
    getLastId: function(recipes) {
        var maxID = 0;
        for (var i = 0; i < recipes.length; i++) {
            if (recipes[i].id > maxID) {
                maxID = recipes[i].id;
            }
        }
        return maxID;
    },

    render: function() {
        return (
            <div id="recipe-box" className="well">
                <h1>RecipeBox</h1>
                <p>This is a RecipeBox. You can add, edit and delete recipes. You can click recipe names to expand them.</p>
                <RecipeAddBox onClickAddRecipe={this.onClickAddRecipe}/>
                <RecipeEditBox ref={ (ref) => this.editModal = ref} onClickEditRecipe={this.onClickEditRecipe}/>
                <RecipeDeleteBox onConfirmDelete={this.onConfirmDelete}/>
                <RecipeList recipes={this.state.recipes} setRecipeForEdit={this.setRecipeForEdit} setRecipeForDelete={this.setRecipeForDelete} />
                <button id="add-button" className="btn btn-info btn-large" data-toggle="modal" data-target="#addRecipeModal">Add Recipe</button>
            </div>
        );
    }
});

ReactDOM.render(
    <RecipeBox />,
    document.getElementById("mount-point")
);


function debug(msg) {
    if ($DEBUG) {
        console.log("DEBUG:" + msg);
    }
}

