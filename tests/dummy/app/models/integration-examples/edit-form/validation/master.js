import DS from 'ember-data';
import BaseModel from 'ember-flexberry/models/base';
import { Projection } from 'ember-flexberry-data';

let Model = BaseModel.extend({
  text: DS.attr('string')
});

// Edit form projection.
Model.defineProjection('MasterL', 'integration-examples/edit-form/validation/master', {
  text: Projection.attr('Text')
});

export default Model;
