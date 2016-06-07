/**
 * @module ember-flexberry
 */

import Ember from 'ember';
import ErrorableControllerMixin from '../mixins/errorable-controller';
import FlexberryLookupMixin from '../mixins/flexberry-lookup';
import FlexberryFileControllerMixin from '../mixins/flexberry-file-controller';

const { getOwner } = Ember;

/**
 * Base controller for the Edit Forms.

   This class re-exports to the application as `/controllers/edit-form`.
   So, you can inherit from `./edit-form`, even if file `app/controllers/edit-form.js`
   is not presented in the application.

   Example:
   ```js
   // app/controllers/employee.js
   import EditFormController from './edit-form';
   export default EditFormController.extend({
   });
   ```

   If you want to add some common logic on all Edit Forms, you can define
   (actually override) `app/controllers/edit-form.js` as follows:
    ```js
    // app/controllers/edit-form.js
    import EditFormController from 'ember-flexberry/controllers/edit-form';
    export default EditFormController.extend({
    });
    ```

 * @class EditFormController
 * @extends Ember.Controller
 * @uses Ember.Evented
 * @uses FlexberryLookupMixin
 * @uses ErrorableControllerMixin
 * @uses FlexberryFileControllerMixin
 */
export default Ember.Controller.extend(Ember.Evented, FlexberryLookupMixin, ErrorableControllerMixin, FlexberryFileControllerMixin, {
  /**
   * Query parameters.
   */
  queryParams: ['readonly'],

  /**
   * Flag to enable return to agregator's path if possible.
   *
   * @property returnToAgregatorRoute
   * @type Boolean
   * @default false
   */
  returnToAgregatorRoute: false,

  /**
   * Indicates whether the current form is opened only for reading.
   *
   * @property readonly
   * @type Boolean
   * @default false
   */
  readonly: false,

  // TODO: add unit test.
  /**
   * Readonly attribute for HTML components following to the `readonly` query param.
   * According to the W3C standard, returns 'readonly' if `readonly` is `true` and `undefined` otherwise.
   *
   * @property readonlyAttr
   * @type String|undefined
   * @default undefined
   * @readOnly
   */
  readonlyAttr: Ember.computed('readonly', function() {
    return this.get('readonly') ? 'readonly' : undefined;
  }),

  /**
   * Lookup settings.
   */
  lookupSettings: {
    controllerName: 'lookup-dialog',
    template: 'lookup-dialog',
    contentTemplate: 'lookup-dialog-content',
    loaderTemplate: 'loading'
  },

  /**
   * If `true`, all details will be deleted along with the main model.
   *
   * @property destroyHasManyRelationshipsOnModelDestroy
   * @type Boolean
   * @default false
   */
  destroyHasManyRelationshipsOnModelDestroy: false,

  /**
   * Controller to show lookup modal window.
   *
   * @property lookupController
   * @type Ember.InjectedProperty
   * @default undefined
   */
  lookupController: Ember.inject.controller('lookup-dialog'),

  /**
   * Flag to cancel rollback of model on controller resetting.
   * Flag is set for interaction of agregator's and detail's routes.
   *
   * @property modelNoRollBack
   * @type Boolean
   * @default false
   */
  modelNoRollBack: false,

  /**
   * Actions handlers.
   */
  actions: {
    /**
     * Default action for button 'Save'.
     * You can override this action to add custom logic.
     *
     * Example:
     * ```js
     * // app/controllers/your-controller.js
     * ...
     * actions: {
     *   ...
     *   save() {
     *     if (confirm('You sure?')) {
     *       this.save();
     *     }
     *   }
     *   ...
     * }
     * ...
     * onSaveActionFulfilled() {
     *   alert('Save successful!');
     * }
     * ...
     * onSaveActionRejected() {
     *   alert('Save failed!');
     * }
     * ...
     * ```
     *
     * @method save.
     */
    save() {
      this.save();
    },

    /**
     * Default action for button 'Save and close'.
     * You can override this action to add custom logic.
     *
     * Example:
     * ```js
     * // app/controllers/your-controller.js
     * ...
     * actions: {
     *   ...
     *   saveAndClose() {
     *     if (confirm('You sure?')) {
     *       this.save(true);
     *     }
     *   }
     *   ...
     * }
     * ...
     * onSaveActionFulfilled() {
     *   alert('Save successful!');
     * }
     * ...
     * onSaveActionRejected() {
     *   alert('Save failed!');
     * }
     * ...
     * ```
     *
     * @method saveAndClose.
     */
    saveAndClose() {
      this.save(true);
    },

    /**
     * Default action for button 'Delete'.
     * You can override this action to add custom logic.
     *
     * Example:
     * ```js
     * // app/controllers/your-controller.js
     * ...
     * actions: {
     *   ...
     *   delete() {
     *     if (confirm('You sure?')) {
     *       this.delete();
     *     }
     *   }
     *   ...
     * }
     * ...
     * onDeleteActionFulfilled() {
     *   alert('Successful delete!');
     *   this.close();
     * }
     * ...
     * onDeleteActionRejected() {
     *   alert('Failed delete!');
     * }
     * ...
     * ```
     *
     * @method delete.
     */
    delete() {
      this.delete();
    },

    /**
     * Default action for button 'Close'.
     * You can override this action to add custom logic.
     *
     * Example:
     * ```js
     * // app/controllers/your-controller.js
     * ...
     * actions: {
     *   ...
     *   close() {
     *     if (confirm('You sure?')) {
     *       this.close();
     *     }
     *   }
     *   ...
     * }
     * ...
     * ```
     *
     * @method close.
     */
    close() {
      this.close();
    }
  },

  /**
    Save object.

    @param {boolean} close If `true`, then save and close.
    @method save.
   */
  save(close) {
    this.send('dismissErrorMessages');

    this.onSaveActionStarted();

    let savePromise = this.get('model').save().then((model) => {
      return this.saveHasManyRelationships(model).then(() => {
        this.onSaveActionFulfilled();
        if (close) {
          this.close();
        }
      });
    }).catch((errorData) => {
      this.onSaveActionRejected(errorData);
    }).finally((data) => {
      this.onSaveActionAlways(data);
    });

    return savePromise;
  },

  /**
    Delete object, if successful transition to parent route.

    @method delete.
   */
  delete() {
    this.send('dismissErrorMessages');

    this.onDeleteActionStarted();

    let model = this.get('model');
    let deletePromise = null;
    if (this.get('destroyHasManyRelationshipsOnModelDestroy')) {
      deletePromise = this.destroyHasManyRelationships(model).then(() => {
        return model.destroyRecord().then(() => {
          this.onDeleteActionFulfilled();
        });
      });
    } else {
      deletePromise = model.destroyRecord().then(() => {
        this.onDeleteActionFulfilled();
      });
    }

    deletePromise.catch((errorData) => {
      this.onDeleteActionRejected(errorData);
    }).finally((data) => {
      this.onDeleteActionAlways(data);
    });

    return deletePromise;
  },

  /**
   * Close edit form and transition to parent route.
   *
   * @method close.
   */
  close() {
    this.onCloseActionStarted();

    this.transitionToParentRoute();
  },

  /**
   * Method to transit to parent's route (previous route).
   * If `parentRoute` is set, transition to defined path.
   * Otherwise transition to corresponding list.
   *
   * @method transitionToParentRoute.
   */
  transitionToParentRoute: function() {
    // TODO: нужно учитывать пэйджинг.
    // Без сервера не обойтись, наверное. Нужно определять, на какую страницу редиректить.
    // Либо редиректить на что-то типа /{parentRoute}/page/whichContains/{object id}, а контроллер/роут там далее разрулит, куда дальше послать редирект.
    let parentRoute = this.get('parentRoute');
    Ember.assert('Parent route must be defined.', parentRoute);
    this.transitionToRoute(parentRoute);
  },

  /**
   * Method to get type and attributes of component,
   * which will be embeded in object-list-view cell.
   *
   * @method getCellComponent.
   * @param {Object} attr Attribute of projection property related to current table cell.
   * @param {String} bindingPath Path to model property related to current table cell.
   * @param {DS.Model} modelClass Model class of data record related to current table row.
   * @return {Object} Object containing name & properties of component, which will be used to render current table cell.
   * { componentName: 'my-component',  componentProperties: { ... } }.
   */
  getCellComponent: function(attr, bindingPath, modelClass) {
    var cellComponent = {
      componentName: 'flexberry-textbox',
      componentProperties: null
    };

    if (attr.kind === 'belongsTo') {
      cellComponent.componentName = 'flexberry-lookup';
      return cellComponent;
    }

    var modelAttr = !Ember.isNone(modelClass) ? Ember.get(modelClass, 'attributes').get(bindingPath) : null;
    if (!(attr.kind === 'attr' && modelAttr && modelAttr.type)) {
      return cellComponent;
    }

    var modelAttrOptions = Ember.get(modelAttr, 'options');

    // Handle order attributes (they must be readonly).
    if (modelAttrOptions && modelAttrOptions.isOrderAttribute) {
      cellComponent.componentName = 'object-list-view-cell';
    }

    switch (modelAttr.type) {
      case 'string':
      case 'number':
        break;
      case 'boolean':
        cellComponent.componentName = 'flexberry-checkbox';
        break;
      case 'date':
        cellComponent.componentName = 'flexberry-datepicker';
        break;
      case 'file':
        cellComponent.componentName = 'flexberry-file';
        break;
      default:

        // Current cell type is possibly custom transform.
        var transformInstance = getOwner(this).lookup('transform:' + modelAttr.type);
        var transformClass = !Ember.isNone(transformInstance) ? transformInstance.constructor : null;

        // Handle enums (extended from transforms/flexberry-enum.js).
        if (transformClass && transformClass.isEnum) {
          cellComponent.componentName = 'flexberry-dropdown';
          cellComponent.componentProperties = {
            items: transformInstance.get('captions')
          };
        }

        break;
    }

    return cellComponent;
  },

  /**
   * Save dirty hasMany relationships in the `model` recursively.
   * This method invokes by `save` method.
   *
   * @method saveHasManyRelationships
   * @param {DS.Model} model Record with hasMany relationships.
   * @return {Promise} A promise that will be resolved to array of saved records.
   */
  saveHasManyRelationships: function(model) {
    let promises = Ember.A();
    model.eachRelationship((name, desc) => {
      if (desc.kind === 'hasMany') {
        model.get(name).filterBy('hasDirtyAttributes', true).forEach((record) => {
          let promise = record.save().then((record) => {
            return this.saveHasManyRelationships(record).then(() => {
              return record;
            });
          });

          promises.pushObject(promise);
        });
      }
    });

    return Ember.RSVP.all(promises);
  },

  /**
   * Rollback dirty hasMany relationships in the `model` recursively.
   * This method invokes by `resetController` in the `edit-form` route.
   *
   * @method rollbackHasManyRelationships
   * @param {DS.Model} model Record with hasMany relationships.
   */
  rollbackHasManyRelationships: function(model) {
    model.eachRelationship((name, desc) => {
      if (desc.kind === 'hasMany') {
        model.get(name).filterBy('hasDirtyAttributes', true).forEach((record) => {
          this.rollbackHasManyRelationships(record);
          record.rollbackAttributes();
        });
      }
    });
  },

  /**
   * Destroy (delete and save) all hasMany relationships in the `model` recursively.
   * This method invokes by `delete` method.
   *
   * @method destroyHasManyRelationships
   * @param {DS.Model} model Record with hasMany relationships.
   * @return {Promise} A promise that will be resolved to array of destroyed records.
   */
  destroyHasManyRelationships: function(model) {
    let promises = Ember.A();
    model.eachRelationship((name, desc) => {
      if (desc.kind === 'hasMany') {
        model.get(name).forEach((record) => {
          let promise = this.destroyHasManyRelationships(record).then(() => {
            return record.destroyRecord();
          });

          promises.pushObject(promise);
        });
      }
    });

    return Ember.RSVP.all(promises);
  },

  /**
    This method will be invoked before save operation will be called.
    Override this method to add some custom logic on save operation start.

    ```javascript
    onSaveActionStarted() {
      alert('Save operation started!');
    }
    ```
    @method onSaveActionStarted.
   */
  onSaveActionStarted() {
  },

  /**
    This method will be invoked when save operation successfully completed.
    Override this method to add some custom logic on save operation success.

    ```javascript
    onSaveActionFulfilled() {
      alert('Save operation succeed!');
    }
    ```
    @method onSaveActionFulfilled.
   */
  onSaveActionFulfilled() {
  },

  /**
    This method will be invoked when save operation completed, but failed.
    Override this method to add some custom logic on save operation fail.

    ```javascript
    onSaveActionRejected() {
      alert('Save operation failed!');
    }
    ```
    @method onSaveActionRejected.
    @param {Object} errorData Data about save operation fail.
   */
  onSaveActionRejected(errorData) {
    this.rejectError(errorData, this.get('i18n').t('forms.edit-form.save-failed-message'));
  },

  /**
    This method will be invoked always when save operation completed,
    regardless of save promise's state (was it fulfilled or rejected).
    Override this method to add some custom logic on save operation completion.

    ```js
    onSaveActionAlways(data) {
      alert('Save operation completed!');
    }
    ```

    @method onSaveActionAlways.
    @param {Object} data Data about completed save operation.
   */
  onSaveActionAlways(data) {
  },

  /**
    This method will be invoked before delete operation will be called.
    Override this method to add custom logic on delete operation start.

    ```javascript
    onDeleteActionStarted() {
      alert('Delete operation started!');
    }
    ```
    @method onDeleteActionStarted.
   */
  onDeleteActionStarted() {
  },

  /**
    This method will be invoked when delete operation successfully completed.
    Override this method to add some custom logic on delete operation success.

    ```javascript
    onDeleteActionFulfilled() {
      alert('Delete operation succeed!');
      this.close();
    }
    ```
    @method onDeleteActionFulfilled.
   */
  onDeleteActionFulfilled() {
    this.close();
  },

  /**
    This method will be invoked when delete operation completed, but failed.
    Override this method to add some custom logic on delete operation fail.

    ```javascript
    onDeleteActionRejected() {
      alert('Delete operation failed!');
    }
    ```
    @method onDeleteActionRejected.
    @param {Object} errorData Data about delete operation fail.
   */
  onDeleteActionRejected(errorData) {
    this.rejectError(errorData, this.get('i18n').t('forms.edit-form.delete-failed-message'));
  },

  /**
    This method will be invoked always when delete operation completed,
    regardless of save promise's state (was it fulfilled or rejected).
    Override this method to add some custom logic on delete operation completion.

    ```js
    onDeleteActionAlways(data) {
      alert('Delete operation completed!');
    }
    ```

    @method onSaveActionAlways.
    @param {Object} data Data about completed save operation.
   */
  onDeleteActionAlways(data) {
  },

  /**
    This method will be invoked before close method will be called.
    Override this method to add custom logic on close method start.

    ```javascript
    onCloseActionStarted() {
      alert('Form will be closed right now!');
    }
    ```
    @method onDeleteActionStarted.
   */
  onCloseActionStarted() {
  },
});
