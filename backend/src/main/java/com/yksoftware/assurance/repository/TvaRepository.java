package com.yksoftware.assurance.repository;

import com.yksoftware.assurance.model.Tva;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TvaRepository extends MongoRepository<Tva, String> {}
