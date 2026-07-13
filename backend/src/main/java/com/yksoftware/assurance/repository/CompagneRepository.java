package com.yksoftware.assurance.repository;

import com.yksoftware.assurance.model.Compagne;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompagneRepository extends MongoRepository<Compagne, String> {
}
